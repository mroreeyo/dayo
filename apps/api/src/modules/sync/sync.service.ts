import { Injectable } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import { SyncResponseDto } from './sync.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CalendarPolicy,
  ) {}

  private serializeEntity(
    entity: { id: string; revision: bigint; [key: string]: unknown },
  ): { id: string; revision: string; [key: string]: unknown } {
    const result: { id: string; revision: string; [key: string]: unknown } = {
      id: entity.id,
      revision: entity.revision.toString(),
    };
    const raw = entity as Record<string, unknown>;
    for (const key of Object.keys(raw)) {
      if (key === 'id' || key === 'revision') continue;
      const val = raw[key];
      if (typeof val === 'bigint') {
        result[key] = val.toString();
      } else if (val instanceof Date) {
        result[key] = val.toISOString();
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  async syncCalendar(
    userId: string,
    calendarId: string,
    since: string,
  ): Promise<SyncResponseDto> {
    await this.policy.authorize(userId, calendarId, MemberRole.MEMBER);

    // Snapshot current revision without advancing the sequence (critical: must read before queries)
    const seqResult = await this.prisma.$queryRaw<
      { last_value: bigint }[]
    >`SELECT last_value FROM app_revision_seq`;
    const snapshot = seqResult[0].last_value;

    const sinceBig = BigInt(since);

    // Range: since < revision <= snapshot
    const [calendars, members, invites, events] = await Promise.all([
      this.prisma.calendar.findMany({
        where: {
          id: calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
      }),
      this.prisma.calendarMember.findMany({
        where: {
          calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
        include: { user: { select: { id: true, email: true, nickname: true } } },
      }),
      this.prisma.invite.findMany({
        where: {
          calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
      }),
      this.prisma.event.findMany({
        where: {
          calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
      }),
    ]);

    const eventUpserts = events
      .filter((e) => e.deletedAt === null)
      .map((e) => this.serializeEntity(e));

    const eventDeletes = events
      .filter((e) => e.deletedAt !== null)
      .map((e) => ({
        id: e.id,
        revision: e.revision.toString(),
        deletedAt: e.deletedAt!.toISOString(),
      }));

    return {
      next: snapshot.toString(),
      calendars: {
        upserts: calendars.map((c) => this.serializeEntity(c)),
        deletes: [],
      },
      members: {
        upserts: members.map((m) => this.serializeEntity(m)),
        deletes: [],
      },
      invites: {
        upserts: invites.map((i) => this.serializeEntity(i)),
        deletes: [],
      },
      events: {
        upserts: eventUpserts,
        deletes: eventDeletes,
      },
    };
  }
}
