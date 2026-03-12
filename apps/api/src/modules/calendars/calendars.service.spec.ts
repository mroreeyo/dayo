import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { AuditAction, AuditEntityType, MemberRole } from "@prisma/client";
import { CalendarsService } from "./calendars.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CalendarPolicy } from "../../libs/policies/calendar.policy";
import { AuditService } from "../audit/audit.service";
import { RealtimeService } from "../realtime/realtime.service";

const mockPrisma = {
  calendarMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  calendar: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
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

describe("CalendarsService", () => {
  let service: CalendarsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarPolicy, useValue: mockPolicy },
        { provide: AuditService, useValue: mockAudit },
        { provide: RealtimeService, useValue: mockRealtime },
      ],
    }).compile();

    service = module.get<CalendarsService>(CalendarsService);
  });

  const userId = "user-1";
  const calendarId = "cal-1";

  describe("listMyCalendars", () => {
    it("returns calendars the user belongs to", async () => {
      mockPrisma.calendarMember.findMany.mockResolvedValue([
        {
          calendar: {
            id: "cal-1",
            name: "Family",
            color: "#FF0000",
            revision: BigInt(100),
          },
          role: MemberRole.OWNER,
        },
        {
          calendar: {
            id: "cal-2",
            name: "Work",
            color: null,
            revision: BigInt(200),
          },
          role: MemberRole.MEMBER,
        },
      ]);

      const result = await service.listMyCalendars(userId);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        id: "cal-1",
        name: "Family",
        color: "#FF0000",
        role: MemberRole.OWNER,
        revision: "100",
      });
      expect(result.items[1]).toEqual({
        id: "cal-2",
        name: "Work",
        color: null,
        role: MemberRole.MEMBER,
        revision: "200",
      });
    });

    it("returns empty list when user has no calendars", async () => {
      mockPrisma.calendarMember.findMany.mockResolvedValue([]);

      const result = await service.listMyCalendars(userId);

      expect(result.items).toEqual([]);
    });
  });

  describe("createCalendar", () => {
    it("creates calendar and adds creator as OWNER", async () => {
      const calendar = {
        id: calendarId,
        name: "New",
        color: "#FFAA00",
        revision: BigInt(1),
      };
      const member = { calendarId, userId, role: MemberRole.OWNER };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({
            calendar: { create: jest.fn().mockResolvedValue(calendar) },
            calendarMember: { create: jest.fn().mockResolvedValue(member) },
          });
        },
      );

      const result = await service.createCalendar(userId, {
        name: "New",
        color: "#FFAA00",
      });

      expect(result).toEqual({
        id: calendarId,
        name: "New",
        color: "#FFAA00",
        role: MemberRole.OWNER,
        revision: "1",
      });
    });

    it("records CREATE audit on calendar creation", async () => {
      const calendar = {
        id: calendarId,
        name: "Audited",
        color: "#FFAA00",
        revision: BigInt(1),
      };
      const member = { calendarId, userId, role: MemberRole.OWNER };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({
            calendar: { create: jest.fn().mockResolvedValue(calendar) },
            calendarMember: { create: jest.fn().mockResolvedValue(member) },
          });
        },
      );

      await service.createCalendar(userId, {
        name: "Audited",
        color: "#FFAA00",
      });

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.CALENDAR,
        calendarId,
        AuditAction.CREATE,
        { name: "Audited", color: "#FFAA00" },
      );
    });

    it("creates calendar with null color when not provided", async () => {
      const calendar = {
        id: calendarId,
        name: "Minimal",
        color: null,
        revision: BigInt(2),
      };
      const member = { calendarId, userId, role: MemberRole.OWNER };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({
            calendar: { create: jest.fn().mockResolvedValue(calendar) },
            calendarMember: { create: jest.fn().mockResolvedValue(member) },
          });
        },
      );

      const result = await service.createCalendar(userId, { name: "Minimal" });

      expect(result.color).toBeNull();
    });
  });

  describe("updateCalendar", () => {
    it("updates calendar when user has ADMIN role", async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      const updated = {
        id: calendarId,
        name: "Updated",
        color: "#00FF00",
        revision: BigInt(10),
      };
      mockPrisma.calendar.update.mockResolvedValue(updated);
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      const result = await service.updateCalendar(userId, calendarId, {
        name: "Updated",
      });

      expect(result.name).toBe("Updated");
      expect(result.revision).toBe("10");
      expect(mockPolicy.authorize).toHaveBeenCalledWith(
        userId,
        calendarId,
        MemberRole.ADMIN,
      );
    });

    it("records UPDATE audit on calendar update", async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      const updated = {
        id: calendarId,
        name: "Updated",
        color: "#00FF00",
        revision: BigInt(10),
      };
      mockPrisma.calendar.update.mockResolvedValue(updated);
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      await service.updateCalendar(userId, calendarId, { name: "Updated" });

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.CALENDAR,
        calendarId,
        AuditAction.UPDATE,
        { name: "Updated" },
      );
    });

    it("rejects MEMBER trying to update", async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException("Requires ADMIN role or higher"),
      );

      await expect(
        service.updateCalendar(userId, calendarId, { name: "Nope" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("deleteCalendar", () => {
    it("deletes calendar when user is OWNER", async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.OWNER,
      });

      mockPrisma.calendar.delete.mockResolvedValue({
        id: calendarId,
        revision: BigInt(50),
      });

      const result = await service.deleteCalendar(userId, calendarId);

      expect(result).toEqual({ ok: true, revision: "50" });
      expect(mockPolicy.authorize).toHaveBeenCalledWith(
        userId,
        calendarId,
        MemberRole.OWNER,
      );
    });

    it("records DELETE audit on calendar deletion", async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.OWNER,
      });

      mockPrisma.calendar.delete.mockResolvedValue({
        id: calendarId,
        revision: BigInt(50),
      });

      await service.deleteCalendar(userId, calendarId);

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.CALENDAR,
        calendarId,
        AuditAction.DELETE,
      );
    });

    it("rejects ADMIN trying to delete", async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException("Requires OWNER role or higher"),
      );

      await expect(service.deleteCalendar(userId, calendarId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("rejects MEMBER trying to delete", async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException("Requires OWNER role or higher"),
      );

      await expect(service.deleteCalendar(userId, calendarId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
