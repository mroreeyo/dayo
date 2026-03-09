import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, GoneException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, MemberRole } from '@prisma/client';
import { InvitesService } from '../invites/invites.service';
import { MembersService } from '../members/members.service';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RecurrenceService } from '../events/recurrence.service';
import { QueuesService } from '../queues/queues.service';
import { RT_EVENTS } from '../../libs/realtime/events';

const mockPrisma = {
  invite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  calendarMember: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  event: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockPolicy = { authorize: jest.fn() };
const mockAudit = { record: jest.fn().mockResolvedValue(undefined) };
const mockRealtime = {
  broadcast: jest.fn(),
  broadcastToUser: jest.fn(),
  bindServer: jest.fn(),
};
const mockRecurrence = { expandOne: jest.fn(), expandMany: jest.fn() };
const mockQueues = {
  enqueueReminder: jest.fn().mockResolvedValue(undefined),
  cancelReminder: jest.fn().mockResolvedValue(undefined),
};

describe('Calendar Lifecycle — E2E-style Integration', () => {
  let invitesService: InvitesService;
  let membersService: MembersService;
  let eventsService: EventsService;
  let realtimeService: RealtimeService;

  const ownerId = 'user-owner';
  const adminId = 'user-admin';
  const newUserId = 'user-new';
  const calendarId = 'cal-1';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        MembersService,
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarPolicy, useValue: mockPolicy },
        { provide: AuditService, useValue: mockAudit },
        { provide: RealtimeService, useValue: mockRealtime },
        { provide: RecurrenceService, useValue: mockRecurrence },
        { provide: QueuesService, useValue: mockQueues },
      ],
    }).compile();

    invitesService = module.get<InvitesService>(InvitesService);
    membersService = module.get<MembersService>(MembersService);
    eventsService = module.get<EventsService>(EventsService);
    realtimeService = module.get<RealtimeService>(RealtimeService);
  });

  describe('Calendar join → member appears', () => {
    it('creates member with MEMBER role when joining via invite code', async () => {
      const inviteRecord = {
        id: 'inv-1',
        calendarId,
        code: 'valid-code-abc',
        expiresAt: null,
        maxUses: null,
        useCount: 0,
        revision: BigInt(100),
      };

      const createdMember = {
        id: 'mem-new',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
        revision: BigInt(200),
        calendar: { revision: BigInt(201) },
      };

      mockPrisma.invite.findUnique.mockResolvedValue(inviteRecord);
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        mockPrisma.invite.update.mockResolvedValue({ ...inviteRecord, useCount: 1 });
        mockPrisma.calendarMember.create.mockResolvedValue(createdMember);
        return fn(mockPrisma);
      });

      const result = await invitesService.joinByCode(newUserId, 'valid-code-abc');

      expect(result.calendarId).toBe(calendarId);
      expect(mockPrisma.calendarMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calendarId,
            userId: newUserId,
            role: MemberRole.MEMBER,
          }),
        }),
      );
    });

    it('records JOIN audit log on invite accept', async () => {
      const inviteRecord = {
        id: 'inv-1',
        calendarId,
        code: 'audit-code',
        expiresAt: null,
        maxUses: null,
        useCount: 0,
        revision: BigInt(100),
      };

      const createdMember = {
        id: 'mem-audit',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
        revision: BigInt(200),
        calendar: { revision: BigInt(201) },
      };

      mockPrisma.invite.findUnique.mockResolvedValue(inviteRecord);
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        mockPrisma.invite.update.mockResolvedValue({ ...inviteRecord, useCount: 1 });
        mockPrisma.calendarMember.create.mockResolvedValue(createdMember);
        return fn(mockPrisma);
      });

      await invitesService.joinByCode(newUserId, 'audit-code');

      expect(mockAudit.record).toHaveBeenCalledWith(
        newUserId,
        calendarId,
        AuditEntityType.MEMBER,
        'mem-audit',
        AuditAction.JOIN,
        { inviteCode: 'audit-code' },
      );
    });

    it('broadcasts MEMBER_JOINED on successful join', async () => {
      const inviteRecord = {
        id: 'inv-1',
        calendarId,
        code: 'broadcast-code',
        expiresAt: null,
        maxUses: null,
        useCount: 0,
        revision: BigInt(100),
      };

      const createdMember = {
        id: 'mem-bc',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
        revision: BigInt(200),
        calendar: { revision: BigInt(201) },
      };

      mockPrisma.invite.findUnique.mockResolvedValue(inviteRecord);
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        mockPrisma.invite.update.mockResolvedValue({ ...inviteRecord, useCount: 1 });
        mockPrisma.calendarMember.create.mockResolvedValue(createdMember);
        return fn(mockPrisma);
      });

      await invitesService.joinByCode(newUserId, 'broadcast-code');

      expect(mockRealtime.broadcast).toHaveBeenCalledWith(
        calendarId,
        RT_EVENTS.MEMBER_JOINED,
        expect.objectContaining({
          calendarId,
          revision: '201',
        }),
      );
    });

    it('rejects already-member with ConflictException', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        id: 'inv-1',
        calendarId,
        code: 'dup-code',
        expiresAt: null,
        maxUses: null,
        useCount: 0,
      });
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        id: 'mem-existing',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
      });

      await expect(
        invitesService.joinByCode(newUserId, 'dup-code'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Member removal', () => {
    it('removes member and returns ok response', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        id: 'mem-target',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
      });
      mockPrisma.calendarMember.delete.mockResolvedValue({
        id: 'mem-target',
        revision: BigInt(300),
      });

      const result = await membersService.removeMember(adminId, calendarId, newUserId);

      expect(result).toEqual({ ok: true, revision: '300' });
    });

    it('broadcasts MEMBER_LEFT to calendar room', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        id: 'mem-target',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
      });
      mockPrisma.calendarMember.delete.mockResolvedValue({
        id: 'mem-target',
        revision: BigInt(300),
      });

      await membersService.removeMember(adminId, calendarId, newUserId);

      expect(mockRealtime.broadcast).toHaveBeenCalledWith(
        calendarId,
        RT_EVENTS.MEMBER_LEFT,
        expect.objectContaining({
          calendarId,
          revision: '300',
          at: expect.any(String),
        }),
      );
    });

    it('broadcasts CALENDAR_REMOVED to removed user', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        id: 'mem-target',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
      });
      mockPrisma.calendarMember.delete.mockResolvedValue({
        id: 'mem-target',
        revision: BigInt(300),
      });

      await membersService.removeMember(adminId, calendarId, newUserId);

      expect(mockRealtime.broadcastToUser).toHaveBeenCalledWith(
        newUserId,
        RT_EVENTS.CALENDAR_REMOVED,
        expect.objectContaining({
          calendarId,
          revision: '300',
          at: expect.any(String),
        }),
      );
    });

    it('records audit log on member removal', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        id: 'mem-target',
        calendarId,
        userId: newUserId,
        role: MemberRole.MEMBER,
      });
      mockPrisma.calendarMember.delete.mockResolvedValue({
        id: 'mem-target',
        revision: BigInt(300),
      });

      await membersService.removeMember(adminId, calendarId, newUserId);

      expect(mockAudit.record).toHaveBeenCalledWith(
        adminId,
        calendarId,
        AuditEntityType.MEMBER,
        'mem-target',
        AuditAction.DELETE,
        { targetUserId: newUserId },
      );
    });
  });

  describe('Realtime event flow', () => {
    it('RealtimeService.broadcast() emits to correct room via server', () => {
      const realRealtimeService = new RealtimeService(mockPrisma as never);
      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      const mockServer = { to: mockTo };

      realRealtimeService.bindServer(mockServer as never);

      const payload = {
        calendarId,
        revision: '500',
        at: '2026-03-01T00:00:00.000Z',
        entityId: 'evt-1',
      };

      realRealtimeService.broadcast(calendarId, RT_EVENTS.EVENT_CREATED, payload);

      expect(mockTo).toHaveBeenCalledWith(`calendar:${calendarId}`);
      expect(mockEmit).toHaveBeenCalledWith(RT_EVENTS.EVENT_CREATED, payload);
    });

    it('event creation triggers broadcast with EVENT_CREATED', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.create.mockResolvedValue({
        id: 'evt-new',
        calendarId,
        creatorId: ownerId,
        title: 'New Event',
        note: null,
        location: null,
        timezone: 'Asia/Seoul',
        allDay: false,
        startAtUtc: new Date('2026-03-01T09:00:00Z'),
        endAtUtc: new Date('2026-03-01T10:00:00Z'),
        startDate: null,
        endDate: null,
        color: null,
        remindMinutes: null,
        version: 1,
        revision: BigInt(500),
        deletedAt: null,
      });

      await eventsService.createEvent(ownerId, {
        calendarId,
        title: 'New Event',
        timezone: 'Asia/Seoul',
        startAtUtc: '2026-03-01T09:00:00Z',
        endAtUtc: '2026-03-01T10:00:00Z',
        startDate: undefined as unknown as string,
        endDate: undefined as unknown as string,
      });

      expect(mockRealtime.broadcast).toHaveBeenCalledWith(
        calendarId,
        RT_EVENTS.EVENT_CREATED,
        expect.objectContaining({
          calendarId,
          revision: '500',
          at: expect.any(String),
          entityId: 'evt-new',
        }),
      );
    });

    it('broadcast payload has correct shape: { calendarId, revision, at, entityId }', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.create.mockResolvedValue({
        id: 'evt-shape',
        calendarId,
        creatorId: ownerId,
        title: 'Shape Test',
        note: null,
        location: null,
        timezone: 'UTC',
        allDay: false,
        startAtUtc: new Date('2026-03-01T09:00:00Z'),
        endAtUtc: new Date('2026-03-01T10:00:00Z'),
        startDate: null,
        endDate: null,
        color: null,
        remindMinutes: null,
        version: 1,
        revision: BigInt(600),
        deletedAt: null,
      });

      await eventsService.createEvent(ownerId, {
        calendarId,
        title: 'Shape Test',
        timezone: 'UTC',
        startAtUtc: '2026-03-01T09:00:00Z',
        endAtUtc: '2026-03-01T10:00:00Z',
        startDate: undefined as unknown as string,
        endDate: undefined as unknown as string,
      });

      const broadcastCall = mockRealtime.broadcast.mock.calls[0];
      const payload = broadcastCall[2];

      expect(payload).toHaveProperty('calendarId', calendarId);
      expect(payload).toHaveProperty('revision', '600');
      expect(payload).toHaveProperty('at');
      expect(payload).toHaveProperty('entityId', 'evt-shape');
      expect(new Date(payload.at).toISOString()).toBe(payload.at);
    });

    it('event deletion triggers broadcast with EVENT_DELETED', async () => {
      mockPrisma.event.findFirst.mockResolvedValue({
        id: 'evt-del',
        calendarId,
        creatorId: ownerId,
        title: 'To Delete',
        note: null,
        location: null,
        timezone: 'UTC',
        allDay: false,
        startAtUtc: new Date('2026-03-01T09:00:00Z'),
        endAtUtc: new Date('2026-03-01T10:00:00Z'),
        startDate: null,
        endDate: null,
        color: null,
        remindMinutes: null,
        version: 1,
        revision: BigInt(700),
        deletedAt: null,
      });
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
      mockPrisma.event.update.mockResolvedValue({
        id: 'evt-del',
        calendarId,
        revision: BigInt(701),
        deletedAt: new Date(),
      });

      await eventsService.deleteEvent(ownerId, 'evt-del');

      expect(mockRealtime.broadcast).toHaveBeenCalledWith(
        calendarId,
        RT_EVENTS.EVENT_DELETED,
        expect.objectContaining({
          calendarId,
          revision: '701',
          entityId: 'evt-del',
        }),
      );
    });
  });
});
