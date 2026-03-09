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
        select: { id: true, revision: true },
      }),
      this.prisma.calendarMember.findMany({
        where: {
          calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
        select: { id: true, revision: true },
      }),
      this.prisma.invite.findMany({
        where: {
          calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
        select: { id: true, revision: true },
      }),
      this.prisma.event.findMany({
        where: {
          calendarId,
          revision: { gt: sinceBig, lte: snapshot },
        },
        select: { id: true, revision: true, deletedAt: true },
      }),
    ]);

    const eventUpserts = events
      .filter((e) => e.deletedAt === null)
      .map((e) => ({ id: e.id, revision: e.revision.toString() }));

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
        upserts: calendars.map((c) => ({ id: c.id, revision: c.revision.toString() })),
        deletes: [],
      },
      members: {
        upserts: members.map((m) => ({ id: m.id, revision: m.revision.toString() })),
        deletes: [],
      },
      invites: {
        upserts: invites.map((i) => ({ id: i.id, revision: i.revision.toString() })),
        deletes: [],
      },
      events: {
        upserts: eventUpserts,
        deletes: eventDeletes,
      },
    };
  }
}
