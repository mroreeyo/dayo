import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, MemberRole } from '@prisma/client';
import { EventsService } from './events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import { AuditService } from '../audit/audit.service';
import { OptimisticLockConflictException } from '../../common/errors/conflict.exception';
import { RealtimeService } from '../realtime/realtime.service';
import { RecurrenceService } from './recurrence.service';
import { QueuesService } from '../queues/queues.service';

const mockPrisma = {
  event: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockPolicy = {
  authorize: jest.fn(),
};

const mockAudit = {
  record: jest.fn().mockResolvedValue(undefined),
};

const mockRealtime = {
  broadcast: jest.fn(),
  broadcastToUser: jest.fn(),
  bindServer: jest.fn(),
};

const mockRecurrence = {
  expandOne: jest.fn(),
  expandMany: jest.fn(),
};

const mockQueues = {
  enqueueReminder: jest.fn().mockResolvedValue(undefined),
  cancelReminder: jest.fn().mockResolvedValue(undefined),
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarPolicy, useValue: mockPolicy },
        { provide: AuditService, useValue: mockAudit },
        { provide: RealtimeService, useValue: mockRealtime },
        { provide: RecurrenceService, useValue: mockRecurrence },
        { provide: QueuesService, useValue: mockQueues },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  const userId = 'user-1';
  const calendarId = 'cal-1';
  const eventId = 'evt-1';

  const timedEvent = {
    id: eventId,
    calendarId,
    creatorId: userId,
    title: 'Meeting',
    note: null,
    location: null,
    timezone: 'Asia/Seoul',
    allDay: false,
    startAtUtc: new Date('2026-02-26T03:00:00Z'),
    endAtUtc: new Date('2026-02-26T04:00:00Z'),
    startDate: null,
    endDate: null,
    color: null,
    remindMinutes: null,
    version: 1,
    revision: BigInt(100),
    deletedAt: null,
  };

  const allDayEvent = {
    id: 'evt-2',
    calendarId,
    creatorId: userId,
    title: 'Holiday',
    note: null,
    location: null,
    timezone: 'Asia/Seoul',
    allDay: true,
    startAtUtc: null,
    endAtUtc: null,
    startDate: new Date('2026-02-26'),
    endDate: new Date('2026-02-27'),
    color: '#FF0000',
    remindMinutes: null,
    version: 1,
    revision: BigInt(101),
    deletedAt: null,
  };

  describe('listEvents', () => {
    it('returns events within range for a member', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.findMany.mockResolvedValue([timedEvent]);

      const result = await service.listEvents(userId, {
        calendarId,
        from: '2026-02-01T00:00:00Z',
        to: '2026-03-01T00:00:00Z',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(eventId);
      expect(result.items[0].startAtUtc).toBe('2026-02-26T03:00:00.000Z');
      expect(result.items[0].revision).toBe('100');
      expect(mockPolicy.authorize).toHaveBeenCalledWith(userId, calendarId, MemberRole.MEMBER);
    });

    it('returns empty list when no events match', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await service.listEvents(userId, {
        calendarId,
        from: '2026-01-01T00:00:00Z',
        to: '2026-01-02T00:00:00Z',
      });

      expect(result.items).toEqual([]);
    });

    it('rejects non-member', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(
        service.listEvents(userId, {
          calendarId,
          from: '2026-02-01T00:00:00Z',
          to: '2026-03-01T00:00:00Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('maps all-day event dates as YYYY-MM-DD strings', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.findMany.mockResolvedValue([allDayEvent]);

      const result = await service.listEvents(userId, {
        calendarId,
        from: '2026-02-01T00:00:00Z',
        to: '2026-03-01T00:00:00Z',
      });

      expect(result.items[0].allDay).toBe(true);
      expect(result.items[0].startDate).toBe('2026-02-26');
      expect(result.items[0].endDate).toBe('2026-02-27');
      expect(result.items[0].startAtUtc).toBeNull();
      expect(result.items[0].endAtUtc).toBeNull();
    });

    it('returns occurrences when includeOccurrences is true', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      const masterEvent = {
        ...timedEvent,
        id: 'evt-master',
        recurrenceRule: {
          id: 'rule-1',
          eventId: 'evt-master',
          rrule: 'FREQ=DAILY;COUNT=3',
          dtstartUtc: new Date('2026-02-26T03:00:00Z'),
          dtstartDate: null,
          untilUtc: null,
          count: 3,
        },
        exceptions: [],
      };

      const sampleOccurrences = [
        {
          recurringEventId: 'evt-master',
          occurrenceKey: '2026-02-26T03:00:00.000Z',
          calendarId,
          allDay: false,
          title: 'Meeting',
          note: null,
          location: null,
          color: null,
          timezone: 'Asia/Seoul',
          startAtUtc: '2026-02-26T03:00:00.000Z',
          endAtUtc: '2026-02-26T04:00:00.000Z',
          overridden: false,
        },
        {
          recurringEventId: 'evt-master',
          occurrenceKey: '2026-02-27T03:00:00.000Z',
          calendarId,
          allDay: false,
          title: 'Meeting',
          note: null,
          location: null,
          color: null,
          timezone: 'Asia/Seoul',
          startAtUtc: '2026-02-27T03:00:00.000Z',
          endAtUtc: '2026-02-27T04:00:00.000Z',
          overridden: false,
        },
      ];

      mockPrisma.event.findMany
        .mockResolvedValueOnce([timedEvent])       // regular events
        .mockResolvedValueOnce([masterEvent]);      // recurring masters
      mockRecurrence.expandMany.mockReturnValue(sampleOccurrences);

      const result = await service.listEvents(userId, {
        calendarId,
        from: '2026-02-01T00:00:00Z',
        to: '2026-03-01T00:00:00Z',
        includeOccurrences: true,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(eventId);
      expect(result.occurrences).toHaveLength(2);
      expect(result.occurrences![0].recurringEventId).toBe('evt-master');
      expect(result.occurrences![1].startAtUtc).toBe('2026-02-27T03:00:00.000Z');
      expect(mockRecurrence.expandMany).toHaveBeenCalledWith(
        [
          {
            event: masterEvent,
            rule: masterEvent.recurrenceRule,
            exceptions: masterEvent.exceptions,
          },
        ],
        {
          from: new Date('2026-02-01T00:00:00Z'),
          to: new Date('2026-03-01T00:00:00Z'),
        },
      );
    });

    it('does not return occurrences when includeOccurrences is not set', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.findMany.mockResolvedValue([timedEvent]);

      const result = await service.listEvents(userId, {
        calendarId,
        from: '2026-02-01T00:00:00Z',
        to: '2026-03-01T00:00:00Z',
      });

      expect(result.items).toHaveLength(1);
      expect(result.occurrences).toBeUndefined();
      expect(mockRecurrence.expandMany).not.toHaveBeenCalled();
    });
  });

  describe('createEvent', () => {
    it('creates a timed event', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.create.mockResolvedValue(timedEvent);

      const result = await service.createEvent(userId, {
        calendarId,
        title: 'Meeting',
        timezone: 'Asia/Seoul',
        startAtUtc: '2026-02-26T03:00:00Z',
        endAtUtc: '2026-02-26T04:00:00Z',
        startDate: undefined as unknown as string,
        endDate: undefined as unknown as string,
      });

      expect(result).toEqual({ ok: true, revision: '100' });
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          calendarId,
          creatorId: userId,
          title: 'Meeting',
          allDay: false,
          startAtUtc: new Date('2026-02-26T03:00:00Z'),
          endAtUtc: new Date('2026-02-26T04:00:00Z'),
          startDate: null,
          endDate: null,
        }),
      });
    });

    it('records CREATE audit on event creation', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.create.mockResolvedValue(timedEvent);

      await service.createEvent(userId, {
        calendarId,
        title: 'Meeting',
        timezone: 'Asia/Seoul',
        startAtUtc: '2026-02-26T03:00:00Z',
        endAtUtc: '2026-02-26T04:00:00Z',
        startDate: undefined as unknown as string,
        endDate: undefined as unknown as string,
      });

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.EVENT,
        eventId,
        AuditAction.CREATE,
        { title: 'Meeting', allDay: false },
      );
    });

    it('creates an all-day event', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.create.mockResolvedValue(allDayEvent);

      const result = await service.createEvent(userId, {
        calendarId,
        title: 'Holiday',
        timezone: 'Asia/Seoul',
        allDay: true,
        startDate: '2026-02-26',
        endDate: '2026-02-27',
        startAtUtc: undefined as unknown as string,
        endAtUtc: undefined as unknown as string,
      });

      expect(result).toEqual({ ok: true, revision: '101' });
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          allDay: true,
          startAtUtc: null,
          endAtUtc: null,
        }),
      });
    });

    it('rejects timed event with endAtUtc <= startAtUtc', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.createEvent(userId, {
          calendarId,
          title: 'Bad',
          timezone: 'UTC',
          startAtUtc: '2026-02-26T04:00:00Z',
          endAtUtc: '2026-02-26T03:00:00Z',
          startDate: undefined as unknown as string,
          endDate: undefined as unknown as string,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects all-day event with endDate <= startDate', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.createEvent(userId, {
          calendarId,
          title: 'Bad',
          timezone: 'UTC',
          allDay: true,
          startDate: '2026-02-27',
          endDate: '2026-02-26',
          startAtUtc: undefined as unknown as string,
          endAtUtc: undefined as unknown as string,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects timed event with startDate/endDate set', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.createEvent(userId, {
          calendarId,
          title: 'Bad',
          timezone: 'UTC',
          allDay: false,
          startAtUtc: '2026-02-26T03:00:00Z',
          endAtUtc: '2026-02-26T04:00:00Z',
          startDate: '2026-02-26',
          endDate: '2026-02-27',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects all-day event with startAtUtc/endAtUtc set', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.createEvent(userId, {
          calendarId,
          title: 'Bad',
          timezone: 'UTC',
          allDay: true,
          startAtUtc: '2026-02-26T03:00:00Z',
          endAtUtc: '2026-02-26T04:00:00Z',
          startDate: '2026-02-26',
          endDate: '2026-02-27',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-member', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(
        service.createEvent(userId, {
          calendarId,
          title: 'Meeting',
          timezone: 'UTC',
          startAtUtc: '2026-02-26T03:00:00Z',
          endAtUtc: '2026-02-26T04:00:00Z',
          startDate: undefined as unknown as string,
          endDate: undefined as unknown as string,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateEvent', () => {
    it('updates event with matching version', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.event.findUniqueOrThrow.mockResolvedValue({
        ...timedEvent,
        title: 'Updated',
        version: 2,
        revision: BigInt(200),
      });

      const result = await service.updateEvent(userId, eventId, {
        version: 1,
        title: 'Updated',
      });

      expect(result).toEqual({ ok: true, revision: '200' });
      expect(mockPrisma.event.updateMany).toHaveBeenCalledWith({
        where: { id: eventId, version: 1, deletedAt: null },
        data: expect.objectContaining({
          title: 'Updated',
          version: { increment: 1 },
        }),
      });
    });

    it('records UPDATE audit on event update', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.event.findUniqueOrThrow.mockResolvedValue({
        ...timedEvent,
        title: 'Updated',
        version: 2,
        revision: BigInt(200),
      });

      await service.updateEvent(userId, eventId, {
        version: 1,
        title: 'Updated',
      });

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.EVENT,
        eventId,
        AuditAction.UPDATE,
        { title: 'Updated' },
      );
    });

    it('throws 409 on version mismatch', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateEvent(userId, eventId, { version: 99, title: 'Stale' }),
      ).rejects.toThrow(OptimisticLockConflictException);
    });

    it('throws 404 for deleted event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEvent(userId, eventId, { version: 1, title: 'Gone' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for non-existent event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEvent(userId, 'no-such-id', { version: 1, title: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects non-member', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(
        service.updateEvent(userId, eventId, { version: 1, title: 'Nope' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects setting startDate/endDate on timed event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.updateEvent(userId, eventId, {
          version: 1,
          startDate: '2026-02-26',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects setting startAtUtc/endAtUtc on all-day event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(allDayEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.updateEvent(userId, 'evt-2', {
          version: 1,
          startAtUtc: '2026-02-26T03:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteEvent', () => {
    it('soft-deletes event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.update.mockResolvedValue({
        ...timedEvent,
        deletedAt: new Date(),
        revision: BigInt(300),
      });

      const result = await service.deleteEvent(userId, eventId);

      expect(result).toEqual({ ok: true, revision: '300' });
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('records DELETE audit on event deletion', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.update.mockResolvedValue({
        ...timedEvent,
        deletedAt: new Date(),
        revision: BigInt(300),
      });

      await service.deleteEvent(userId, eventId);

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.EVENT,
        eventId,
        AuditAction.DELETE,
      );
    });

    it('throws 404 for already-deleted event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.deleteEvent(userId, eventId)).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for non-existent event', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      await expect(service.deleteEvent(userId, 'no-such-id')).rejects.toThrow(NotFoundException);
    });

    it('rejects non-member', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(timedEvent);
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(service.deleteEvent(userId, eventId)).rejects.toThrow(ForbiddenException);
    });
  });
});
