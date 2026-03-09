import { Test, TestingModule } from '@nestjs/testing';
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

const mockPolicy = { authorize: jest.fn() };

describe('SyncService — Integration: Sync Window Cursor', () => {
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
    mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
  });

  function setupSnapshot(revision: bigint) {
    mockPrisma.$queryRaw.mockResolvedValue([{ last_value: revision }]);
  }

  function setupEntities(opts: {
    calendars?: Array<{ id: string; revision: bigint }>;
    members?: Array<{ id: string; revision: bigint }>;
    invites?: Array<{ id: string; revision: bigint }>;
    events?: Array<{ id: string; revision: bigint; deletedAt: Date | null }>;
  }) {
    mockPrisma.calendar.findMany.mockResolvedValue(opts.calendars ?? []);
    mockPrisma.calendarMember.findMany.mockResolvedValue(opts.members ?? []);
    mockPrisma.invite.findMany.mockResolvedValue(opts.invites ?? []);
    mockPrisma.event.findMany.mockResolvedValue(opts.events ?? []);
  }

  describe('since=0 returns all entities', () => {
    it('returns every entity in the calendar', async () => {
      setupSnapshot(BigInt(500));
      setupEntities({
        calendars: [{ id: calendarId, revision: BigInt(10) }],
        members: [
          { id: 'mem-1', revision: BigInt(20) },
          { id: 'mem-2', revision: BigInt(30) },
        ],
        invites: [{ id: 'inv-1', revision: BigInt(50) }],
        events: [
          { id: 'evt-1', revision: BigInt(100), deletedAt: null },
          { id: 'evt-2', revision: BigInt(200), deletedAt: null },
          { id: 'evt-3', revision: BigInt(300), deletedAt: new Date('2026-03-01T00:00:00Z') },
        ],
      });

      const result = await service.syncCalendar(userId, calendarId, '0');

      expect(result.next).toBe('500');
      expect(result.calendars.upserts).toHaveLength(1);
      expect(result.members.upserts).toHaveLength(2);
      expect(result.invites.upserts).toHaveLength(1);
      expect(result.events.upserts).toHaveLength(2);
      expect(result.events.deletes).toHaveLength(1);
    });
  });

  describe('since=100 returns only entities with revision > 100', () => {
    it('filters out entities at or below the cursor', async () => {
      setupSnapshot(BigInt(500));
      setupEntities({
        events: [
          { id: 'evt-new', revision: BigInt(200), deletedAt: null },
          { id: 'evt-newer', revision: BigInt(400), deletedAt: null },
        ],
      });

      const result = await service.syncCalendar(userId, calendarId, '100');

      expect(result.next).toBe('500');
      expect(result.events.upserts).toEqual([
        { id: 'evt-new', revision: '200' },
        { id: 'evt-newer', revision: '400' },
      ]);
    });

    it('passes correct BigInt filter to Prisma queries', async () => {
      setupSnapshot(BigInt(500));
      setupEntities({});

      await service.syncCalendar(userId, calendarId, '100');

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {
          calendarId,
          revision: { gt: BigInt(100), lte: BigInt(500) },
        },
        select: { id: true, revision: true, deletedAt: true },
      });
    });
  });

  describe('next equals snapshot value', () => {
    it('returns snapshot as next cursor regardless of entity revisions', async () => {
      setupSnapshot(BigInt(999));
      setupEntities({
        events: [{ id: 'evt-1', revision: BigInt(500), deletedAt: null }],
      });

      const result = await service.syncCalendar(userId, calendarId, '0');

      expect(result.next).toBe('999');
    });

    it('returns snapshot even when no entities changed', async () => {
      setupSnapshot(BigInt(750));
      setupEntities({});

      const result = await service.syncCalendar(userId, calendarId, '750');

      expect(result.next).toBe('750');
    });
  });

  describe('events split into upserts and deletes', () => {
    it('non-deleted events go to upserts, soft-deleted to deletes', async () => {
      const deletedAt = new Date('2026-03-15T12:00:00Z');
      setupSnapshot(BigInt(1000));
      setupEntities({
        events: [
          { id: 'evt-active-1', revision: BigInt(800), deletedAt: null },
          { id: 'evt-active-2', revision: BigInt(850), deletedAt: null },
          { id: 'evt-deleted-1', revision: BigInt(900), deletedAt },
          { id: 'evt-deleted-2', revision: BigInt(950), deletedAt },
        ],
      });

      const result = await service.syncCalendar(userId, calendarId, '700');

      expect(result.events.upserts).toEqual([
        { id: 'evt-active-1', revision: '800' },
        { id: 'evt-active-2', revision: '850' },
      ]);
      expect(result.events.deletes).toEqual([
        { id: 'evt-deleted-1', revision: '900', deletedAt: '2026-03-15T12:00:00.000Z' },
        { id: 'evt-deleted-2', revision: '950', deletedAt: '2026-03-15T12:00:00.000Z' },
      ]);
    });

    it('returns empty upserts and deletes when no events changed', async () => {
      setupSnapshot(BigInt(500));
      setupEntities({});

      const result = await service.syncCalendar(userId, calendarId, '500');

      expect(result.events.upserts).toEqual([]);
      expect(result.events.deletes).toEqual([]);
    });
  });

  describe('all revisions serialized as strings', () => {
    it('serializes BigInt revisions to string in response', async () => {
      setupSnapshot(BigInt('9007199254740993'));
      setupEntities({
        calendars: [{ id: calendarId, revision: BigInt('9007199254740991') }],
        events: [
          { id: 'evt-1', revision: BigInt('9007199254740992'), deletedAt: null },
        ],
      });

      const result = await service.syncCalendar(userId, calendarId, '0');

      expect(result.next).toBe('9007199254740993');
      expect(result.calendars.upserts[0].revision).toBe('9007199254740991');
      expect(result.events.upserts[0].revision).toBe('9007199254740992');
      expect(typeof result.next).toBe('string');
    });
  });
});
