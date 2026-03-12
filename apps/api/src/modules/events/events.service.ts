import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { AuditAction, AuditEntityType, MemberRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CalendarPolicy } from "../../libs/policies/calendar.policy";
import { AuditService } from "../audit/audit.service";
import { OptimisticLockConflictException } from "../../common/errors/conflict.exception";
import { OkRevisionResponseDto } from "../../common/dto/ok-revision.dto";
import {
  CreateEventDto,
  UpdateEventDto,
  EventsQueryDto,
  EventDto,
  ListEventsResponseDto,
  OccurrenceDto,
} from "./events.dto";
import { RealtimeService } from "../realtime/realtime.service";
import { RT_EVENTS } from "../../libs/realtime/events";
import { RecurrenceService } from "./recurrence.service";
import { QueuesService } from "../queues/queues.service";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CalendarPolicy,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeService,
    private readonly recurrence: RecurrenceService,
    private readonly queues: QueuesService,
  ) {}

  async listEvents(
    userId: string,
    q: EventsQueryDto,
  ): Promise<ListEventsResponseDto> {
    await this.policy.authorize(userId, q.calendarId, MemberRole.MEMBER);

    const from = new Date(q.from);
    const to = new Date(q.to);

    const events = await this.prisma.event.findMany({
      where: {
        calendarId: q.calendarId,
        deletedAt: null,
        OR: [
          { allDay: false, startAtUtc: { lt: to }, endAtUtc: { gt: from } },
          { allDay: true, startDate: { lt: to }, endDate: { gt: from } },
        ],
      },
      orderBy: [{ allDay: "asc" }, { startAtUtc: "asc" }, { startDate: "asc" }],
    });

    const items: EventDto[] = events.map((e) => this.toEventDto(e));

    if (!q.includeOccurrences) {
      return { items };
    }

    const masters = await this.prisma.event.findMany({
      where: {
        calendarId: q.calendarId,
        deletedAt: null,
        recurrenceRule: { isNot: null },
      },
      include: {
        recurrenceRule: true,
        exceptions: true,
      },
    });

    const expandInput = masters
      .filter((m) => m.recurrenceRule !== null)
      .map((m) => ({
        event: m,
        rule: m.recurrenceRule!,
        exceptions: m.exceptions,
      }));

    const rawOccurrences = this.recurrence.expandMany(expandInput, {
      from,
      to,
    });

    const occurrences: OccurrenceDto[] = rawOccurrences.map((o) => ({
      recurringEventId: o.recurringEventId,
      occurrenceKey: o.occurrenceKey,
      calendarId: o.calendarId,
      allDay: o.allDay,
      title: o.title,
      note: o.note ?? null,
      location: o.location ?? null,
      color: o.color ?? null,
      timezone: o.timezone,
      startAtUtc: o.startAtUtc,
      endAtUtc: o.endAtUtc,
      startDate: o.startDate,
      endDate: o.endDate,
      overridden: o.overridden,
    }));

    return { items, occurrences };
  }

  async createEvent(
    userId: string,
    dto: CreateEventDto,
  ): Promise<OkRevisionResponseDto> {
    await this.policy.authorize(userId, dto.calendarId, MemberRole.MEMBER);

    this.validateTimeFields(dto);

    const event = await this.prisma.event.create({
      data: {
        calendarId: dto.calendarId,
        creatorId: userId,
        title: dto.title,
        note: dto.note ?? null,
        location: dto.location ?? null,
        timezone: dto.timezone,
        allDay: dto.allDay ?? false,
        startAtUtc: dto.allDay ? null : new Date(dto.startAtUtc),
        endAtUtc: dto.allDay ? null : new Date(dto.endAtUtc),
        startDate: dto.allDay ? new Date(dto.startDate) : null,
        endDate: dto.allDay ? new Date(dto.endDate) : null,
        color: dto.color ?? null,
        remindMinutes: dto.remindMinutes ?? null,
      },
    });

    await this.audit.record(
      userId,
      dto.calendarId,
      AuditEntityType.EVENT,
      event.id,
      AuditAction.CREATE,
      { title: dto.title, allDay: dto.allDay ?? false },
    );

    this.realtime.broadcast(dto.calendarId, RT_EVENTS.EVENT_CREATED, {
      calendarId: dto.calendarId,
      revision: event.revision.toString(),
      at: new Date().toISOString(),
      entityId: event.id,
    });

    if (event.remindMinutes != null && event.startAtUtc) {
      const fireAt = new Date(
        event.startAtUtc.getTime() - event.remindMinutes * 60_000,
      );
      await this.queues.enqueueReminder({
        eventId: event.id,
        userId,
        calendarId: dto.calendarId,
        title: event.title,
        fireAt: fireAt.toISOString(),
      });
    }

    return { ok: true, revision: event.revision.toString() };
  }

  async updateEvent(
    userId: string,
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<OkRevisionResponseDto> {
    const existing = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException("Event not found");
    }

    await this.policy.authorize(userId, existing.calendarId, MemberRole.MEMBER);

    const { version, ...fields } = dto;

    const data: Record<string, unknown> = {};
    if (fields.title !== undefined) data.title = fields.title;
    if (fields.note !== undefined) data.note = fields.note;
    if (fields.location !== undefined) data.location = fields.location;
    if (fields.timezone !== undefined) data.timezone = fields.timezone;
    if (fields.color !== undefined) data.color = fields.color;
    if (fields.remindMinutes !== undefined)
      data.remindMinutes = fields.remindMinutes;

    if (fields.allDay !== undefined) {
      data.allDay = fields.allDay;
    }

    const resolvedAllDay =
      fields.allDay !== undefined ? fields.allDay : existing.allDay;

    if (fields.startAtUtc !== undefined)
      data.startAtUtc = new Date(fields.startAtUtc);
    if (fields.endAtUtc !== undefined)
      data.endAtUtc = new Date(fields.endAtUtc);
    if (fields.startDate !== undefined)
      data.startDate = new Date(fields.startDate);
    if (fields.endDate !== undefined) data.endDate = new Date(fields.endDate);

    if (resolvedAllDay) {
      if (data.startAtUtc !== undefined || data.endAtUtc !== undefined) {
        throw new BadRequestException(
          "All-day events must not have startAtUtc/endAtUtc",
        );
      }
    } else {
      if (data.startDate !== undefined || data.endDate !== undefined) {
        throw new BadRequestException(
          "Timed events must not have startDate/endDate",
        );
      }
    }

    data.version = { increment: 1 };

    const result = await this.prisma.event.updateMany({
      where: { id: eventId, version, deletedAt: null },
      data,
    });

    if (result.count === 0) {
      throw new OptimisticLockConflictException();
    }

    const updated = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });

    const auditDiff: Record<string, unknown> = {};
    if (fields.title !== undefined) auditDiff.title = fields.title;
    if (fields.note !== undefined) auditDiff.note = fields.note;
    if (fields.location !== undefined) auditDiff.location = fields.location;
    if (fields.timezone !== undefined) auditDiff.timezone = fields.timezone;
    if (fields.color !== undefined) auditDiff.color = fields.color;
    if (fields.allDay !== undefined) auditDiff.allDay = fields.allDay;
    if (fields.startAtUtc !== undefined)
      auditDiff.startAtUtc = fields.startAtUtc;
    if (fields.endAtUtc !== undefined) auditDiff.endAtUtc = fields.endAtUtc;
    if (fields.startDate !== undefined) auditDiff.startDate = fields.startDate;
    if (fields.endDate !== undefined) auditDiff.endDate = fields.endDate;

    await this.audit.record(
      userId,
      existing.calendarId,
      AuditEntityType.EVENT,
      eventId,
      AuditAction.UPDATE,
      auditDiff,
    );

    this.realtime.broadcast(existing.calendarId, RT_EVENTS.EVENT_UPDATED, {
      calendarId: existing.calendarId,
      revision: updated.revision.toString(),
      at: new Date().toISOString(),
      entityId: eventId,
    });

    await this.queues.cancelReminder(eventId);
    if (updated.remindMinutes != null && updated.startAtUtc) {
      const fireAt = new Date(
        updated.startAtUtc.getTime() - updated.remindMinutes * 60_000,
      );
      await this.queues.enqueueReminder({
        eventId,
        userId,
        calendarId: existing.calendarId,
        title: updated.title,
        fireAt: fireAt.toISOString(),
      });
    }

    return { ok: true, revision: updated.revision.toString() };
  }

  async deleteEvent(
    userId: string,
    eventId: string,
  ): Promise<OkRevisionResponseDto> {
    const existing = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException("Event not found");
    }

    await this.policy.authorize(userId, existing.calendarId, MemberRole.MEMBER);

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    await this.audit.record(
      userId,
      existing.calendarId,
      AuditEntityType.EVENT,
      eventId,
      AuditAction.DELETE,
    );

    this.realtime.broadcast(existing.calendarId, RT_EVENTS.EVENT_DELETED, {
      calendarId: existing.calendarId,
      revision: updated.revision.toString(),
      at: new Date().toISOString(),
      entityId: eventId,
    });

    await this.queues.cancelReminder(eventId);

    return { ok: true, revision: updated.revision.toString() };
  }

  private validateTimeFields(dto: CreateEventDto): void {
    if (dto.allDay) {
      if (dto.startAtUtc || dto.endAtUtc) {
        throw new BadRequestException(
          "All-day events must not have startAtUtc/endAtUtc",
        );
      }
      if (!dto.startDate || !dto.endDate) {
        throw new BadRequestException(
          "All-day events require startDate and endDate",
        );
      }
      if (dto.endDate <= dto.startDate) {
        throw new BadRequestException("endDate must be after startDate");
      }
    } else {
      if (dto.startDate || dto.endDate) {
        throw new BadRequestException(
          "Timed events must not have startDate/endDate",
        );
      }
      if (!dto.startAtUtc || !dto.endAtUtc) {
        throw new BadRequestException(
          "Timed events require startAtUtc and endAtUtc",
        );
      }
      if (new Date(dto.endAtUtc) <= new Date(dto.startAtUtc)) {
        throw new BadRequestException("endAtUtc must be after startAtUtc");
      }
    }
  }

  private toEventDto(e: {
    id: string;
    calendarId: string;
    creatorId: string;
    title: string;
    note: string | null;
    location: string | null;
    timezone: string;
    allDay: boolean;
    startAtUtc: Date | null;
    endAtUtc: Date | null;
    startDate: Date | null;
    endDate: Date | null;
    color: string | null;
    remindMinutes: number | null;
    version: number;
    revision: bigint;
  }): EventDto {
    return {
      id: e.id,
      calendarId: e.calendarId,
      creatorId: e.creatorId,
      title: e.title,
      note: e.note,
      location: e.location,
      timezone: e.timezone,
      allDay: e.allDay,
      startAtUtc: e.startAtUtc?.toISOString() ?? null,
      endAtUtc: e.endAtUtc?.toISOString() ?? null,
      startDate: e.startDate ? e.startDate.toISOString().slice(0, 10) : null,
      endDate: e.endDate ? e.endDate.toISOString().slice(0, 10) : null,
      color: e.color,
      remindMinutes: e.remindMinutes,
      version: e.version,
      revision: e.revision.toString(),
    };
  }
}
