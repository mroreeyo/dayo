import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import { AuditService } from '../audit/audit.service';
import { CreateCalendarDto, UpdateCalendarDto, CalendarItemDto, ListCalendarsResponseDto } from './calendars.dto';
import { OkRevisionResponseDto } from '../../common/dto/ok-revision.dto';

@Injectable()
export class CalendarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CalendarPolicy,
    private readonly audit: AuditService,
  ) {}

  async listMyCalendars(userId: string): Promise<ListCalendarsResponseDto> {
    const memberships = await this.prisma.calendarMember.findMany({
      where: { userId },
      include: { calendar: true },
    });

    const items: CalendarItemDto[] = memberships.map((m) => ({
      id: m.calendar.id,
      name: m.calendar.name,
      color: m.calendar.color,
      role: m.role,
      revision: m.calendar.revision.toString(),
    }));

    return { items };
  }

  async createCalendar(userId: string, dto: CreateCalendarDto): Promise<CalendarItemDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const calendar = await tx.calendar.create({
        data: {
          name: dto.name,
          color: dto.color ?? null,
        },
      });

      const member = await tx.calendarMember.create({
        data: {
          calendarId: calendar.id,
          userId,
          role: MemberRole.OWNER,
        },
      });

      return { calendar, member };
    });

    await this.audit.record(
      userId,
      result.calendar.id,
      AuditEntityType.CALENDAR,
      result.calendar.id,
      AuditAction.CREATE,
      { name: result.calendar.name, color: result.calendar.color },
    );

    return {
      id: result.calendar.id,
      name: result.calendar.name,
      color: result.calendar.color,
      role: result.member.role,
      revision: result.calendar.revision.toString(),
    };
  }

  async updateCalendar(
    userId: string,
    calendarId: string,
    dto: UpdateCalendarDto,
  ): Promise<CalendarItemDto> {
    await this.policy.authorize(userId, calendarId, MemberRole.ADMIN);

    const calendar = await this.prisma.calendar.update({
      where: { id: calendarId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });

    const member = await this.prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const diff: Record<string, unknown> = {};
    if (dto.name !== undefined) diff.name = dto.name;
    if (dto.color !== undefined) diff.color = dto.color;

    await this.audit.record(
      userId,
      calendarId,
      AuditEntityType.CALENDAR,
      calendarId,
      AuditAction.UPDATE,
      diff,
    );

    return {
      id: calendar.id,
      name: calendar.name,
      color: calendar.color,
      role: member.role,
      revision: calendar.revision.toString(),
    };
  }

  async deleteCalendar(
    userId: string,
    calendarId: string,
  ): Promise<OkRevisionResponseDto> {
    await this.policy.authorize(userId, calendarId, MemberRole.OWNER);

    const calendar = await this.prisma.calendar.delete({
      where: { id: calendarId },
    });

    await this.audit.record(
      userId,
      calendarId,
      AuditEntityType.CALENDAR,
      calendarId,
      AuditAction.DELETE,
    );

    return {
      ok: true,
      revision: calendar.revision.toString(),
    };
  }
}
