import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { SyncService } from './sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';

const mockPrisma = {
  $queryRaw: jest.fn(),
  calendar: { findMany: jest.fn() },
  calendarMember: { findMany: jest.fn() },
  invite: { findMany: jest.fn() },
  event: { findMany: jest.fn() },
};

const mockPolicy = {
  authorize: jest.fn(),
};

describe('SyncService', () => {
  let service: SyncService;

  const userId = 'user-1';
  const calendarId = 'cal-1';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarPolicy, useValue: mockPolicy },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  function setupSnapshot(revision: bigint) {
    mockPrisma.$queryRaw.mockResolvedValue([{ last_value: revision }]);
  }

  function setupEmptyResults() {
    mockPrisma.calendar.findMany.mockResolvedValue([]);
    mockPrisma.calendarMember.findMany.mockResolvedValue([]);
    mockPrisma.invite.findMany.mockResolvedValue([]);
    mockPrisma.event.findMany.mockResolvedValue([]);
  }

  describe('initial sync (since=0)', () => {
    it('returns all data for the calendar', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      setupSnapshot(BigInt(500));

      mockPrisma.calendar.findMany.mockResolvedValue([
        { id: calendarId, revision: BigInt(100) },
      ]);
      mockPrisma.calendarMember.findMany.mockResolvedValue([
        { id: 'mem-1', revision: BigInt(101) },
      ]);
      mockPrisma.invite.findMany.mockResolvedValue([
        { id: 'inv-1', revision: BigInt(200) },
      ]);
      mockPrisma.event.findMany.mockResolvedValue([
        { id: 'evt-1', revision: BigInt(300), deletedAt: null },
        { id: 'evt-2', revision: BigInt(400), deletedAt: null },
      ]);

      const result = await service.syncCalendar(userId, calendarId, '0');

      expect(result.next).toBe('500');
      expect(result.calendars.upserts).toEqual([expect.objectContaining({ id: calendarId, revision: '100' })]);
      expect(result.calendars.deletes).toEqual([]);
      expect(result.members.upserts).toEqual([expect.objectContaining({ id: 'mem-1', revision: '101' })]);
      expect(result.invites.upserts).toEqual([expect.objectContaining({ id: 'inv-1', revision: '200' })]);
      expect(result.events.upserts).toHaveLength(2);
      expect(result.events.deletes).toEqual([]);
    });
  });

  describe('delta sync with new event', () => {
    it('returns only entities changed since the cursor', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      setupSnapshot(BigInt(600));

      mockPrisma.calendar.findMany.mockResolvedValue([]);
      mockPrisma.calendarMember.findMany.mockResolvedValue([]);
      mockPrisma.invite.findMany.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue([
        { id: 'evt-3', revision: BigInt(550), deletedAt: null },
      ]);

      const result = await service.syncCalendar(userId, calendarId, '500');

      expect(result.next).toBe('600');
      expect(result.calendars.upserts).toEqual([]);
      expect(result.events.upserts).toEqual([expect.objectContaining({ id: 'evt-3', revision: '550' })]);
      expect(result.events.deletes).toEqual([]);
    });
  });

  describe('soft-deleted event appears in deletes bucket', () => {
    it('separates active events from soft-deleted events', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      setupSnapshot(BigInt(700));

      const deletedAt = new Date('2026-03-01T10:00:00Z');

      mockPrisma.calendar.findMany.mockResolvedValue([]);
      mockPrisma.calendarMember.findMany.mockResolvedValue([]);
      mockPrisma.invite.findMany.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue([
        { id: 'evt-1', revision: BigInt(650), deletedAt: null },
        { id: 'evt-2', revision: BigInt(680), deletedAt },
      ]);

      const result = await service.syncCalendar(userId, calendarId, '600');

      expect(result.events.upserts).toEqual([expect.objectContaining({ id: 'evt-1', revision: '650' })]);
      expect(result.events.deletes).toEqual([
        { id: 'evt-2', revision: '680', deletedAt: '2026-03-01T10:00:00.000Z' },
      ]);
    });
  });

  describe('revision cursor is a string representation of BigInt', () => {
    it('returns next as string and all revisions as strings', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      setupSnapshot(BigInt(999999999999));

      mockPrisma.calendar.findMany.mockResolvedValue([
        { id: calendarId, revision: BigInt(999999999998) },
      ]);
      mockPrisma.calendarMember.findMany.mockResolvedValue([]);
      mockPrisma.invite.findMany.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await service.syncCalendar(userId, calendarId, '0');

      expect(result.next).toBe('999999999999');
      expect(typeof result.next).toBe('string');
      expect(result.calendars.upserts[0].revision).toBe('999999999998');
      expect(typeof result.calendars.upserts[0].revision).toBe('string');
    });
  });

  describe('authorization', () => {
    it('rejects non-member with 403', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(
        service.syncCalendar(userId, calendarId, '0'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPolicy.authorize).toHaveBeenCalledWith(
        userId,
        calendarId,
        MemberRole.MEMBER,
      );
    });

    it('does not query entities when authorization fails', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(
        service.syncCalendar(userId, calendarId, '0'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
      expect(mockPrisma.calendar.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.event.findMany).not.toHaveBeenCalled();
    });
  });

  describe('empty sync', () => {
    it('returns empty buckets when no changes since cursor', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      setupSnapshot(BigInt(500));
      setupEmptyResults();

      const result = await service.syncCalendar(userId, calendarId, '500');

      expect(result.next).toBe('500');
      expect(result.calendars).toEqual({ upserts: [], deletes: [] });
      expect(result.members).toEqual({ upserts: [], deletes: [] });
      expect(result.invites).toEqual({ upserts: [], deletes: [] });
      expect(result.events).toEqual({ upserts: [], deletes: [] });
    });
  });
});
