import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { MemberRole } from "@prisma/client";
import { EventsService } from "./events.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CalendarPolicy } from "../../libs/policies/calendar.policy";
import { AuditService } from "../audit/audit.service";
import { OptimisticLockConflictException } from "../../common/errors/conflict.exception";
import { RealtimeService } from "../realtime/realtime.service";
import { RecurrenceService } from "./recurrence.service";
import { QueuesService } from "../queues/queues.service";

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

describe("EventsService — Integration: Optimistic Lock Conflict", () => {
  let service: EventsService;

  const userId = "user-1";
  const calendarId = "cal-1";
  const eventId = "evt-1";

  const existingEvent = {
    id: eventId,
    calendarId,
    creatorId: userId,
    title: "Original Title",
    note: null,
    location: null,
    timezone: "Asia/Seoul",
    allDay: false,
    startAtUtc: new Date("2026-03-01T09:00:00Z"),
    endAtUtc: new Date("2026-03-01T10:00:00Z"),
    startDate: null,
    endDate: null,
    color: null,
    remindMinutes: null,
    version: 3,
    revision: BigInt(500),
    deletedAt: null,
  };

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

  it("throws OptimisticLockConflictException when updateMany returns count: 0", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(existingEvent);
    mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
    mockPrisma.event.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateEvent(userId, eventId, {
        version: 1,
        title: "Stale Update",
      }),
    ).rejects.toThrow(OptimisticLockConflictException);
  });

  it("returns 409 status with OPTIMISTIC_LOCK_CONFLICT error", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(existingEvent);
    mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
    mockPrisma.event.updateMany.mockResolvedValue({ count: 0 });

    try {
      await service.updateEvent(userId, eventId, {
        version: 1,
        title: "Stale",
      });
      fail("Expected OptimisticLockConflictException");
    } catch (err) {
      expect(err).toBeInstanceOf(OptimisticLockConflictException);
      const response = (err as OptimisticLockConflictException).getResponse();
      expect(response).toEqual(
        expect.objectContaining({
          statusCode: 409,
          error: "OPTIMISTIC_LOCK_CONFLICT",
        }),
      );
    }
  });

  it("does not record audit or broadcast on conflict", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(existingEvent);
    mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
    mockPrisma.event.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateEvent(userId, eventId, { version: 1, title: "Stale" }),
    ).rejects.toThrow(OptimisticLockConflictException);

    expect(mockAudit.record).not.toHaveBeenCalled();
    expect(mockRealtime.broadcast).not.toHaveBeenCalled();
  });

  it("succeeds when version matches (count: 1)", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(existingEvent);
    mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });
    mockPrisma.event.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.event.findUniqueOrThrow.mockResolvedValue({
      ...existingEvent,
      title: "Updated",
      version: 4,
      revision: BigInt(501),
    });

    const result = await service.updateEvent(userId, eventId, {
      version: 3,
      title: "Updated",
    });

    expect(result).toEqual({ ok: true, revision: "501" });
    expect(mockAudit.record).toHaveBeenCalled();
    expect(mockRealtime.broadcast).toHaveBeenCalled();
  });

  it("throws NotFoundException for non-existent event before version check", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.updateEvent(userId, eventId, { version: 1, title: "Ghost" }),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.event.updateMany).not.toHaveBeenCalled();
  });
});
