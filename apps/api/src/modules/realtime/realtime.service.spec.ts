import { Test, TestingModule } from "@nestjs/testing";
import { WsException } from "@nestjs/websockets";
import { RealtimeService } from "./realtime.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RT_EVENTS } from "../../libs/realtime/events";

const mockPrisma = {
  calendarMember: {
    findUnique: jest.fn(),
  },
};

describe("RealtimeService", () => {
  let service: RealtimeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
  });

  describe("joinCalendarRoom", () => {
    const userId = "user-1";
    const calendarId = "cal-1";

    it("joins room when user is a member", async () => {
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId,
        role: "MEMBER",
      });

      const mockClient = { join: jest.fn().mockResolvedValue(undefined) };

      await service.joinCalendarRoom(mockClient as never, userId, calendarId);

      expect(mockClient.join).toHaveBeenCalledWith(`calendar:${calendarId}`);
    });

    it("throws WsException when user is not a member", async () => {
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

      const mockClient = { join: jest.fn() };

      await expect(
        service.joinCalendarRoom(mockClient as never, userId, calendarId),
      ).rejects.toThrow(WsException);
    });
  });

  describe("broadcast", () => {
    it("emits to correct calendar room", () => {
      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      const mockServer = { to: mockTo };

      service.bindServer(mockServer as never);

      const payload = {
        calendarId: "cal-1",
        revision: "100",
        at: "2026-01-01T00:00:00.000Z",
      };

      service.broadcast("cal-1", RT_EVENTS.CALENDAR_UPDATED, payload);

      expect(mockTo).toHaveBeenCalledWith("calendar:cal-1");
      expect(mockEmit).toHaveBeenCalledWith(
        RT_EVENTS.CALENDAR_UPDATED,
        payload,
      );
    });

    it("does nothing when server is not bound", () => {
      service.broadcast("cal-1", RT_EVENTS.CALENDAR_UPDATED, {
        calendarId: "cal-1",
        revision: "100",
        at: "2026-01-01T00:00:00.000Z",
      });
    });
  });

  describe("broadcastToUser", () => {
    it("emits to correct user room", () => {
      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      const mockServer = { to: mockTo };

      service.bindServer(mockServer as never);

      const payload = {
        calendarId: "cal-1",
        revision: "200",
        at: "2026-01-01T00:00:00.000Z",
      };

      service.broadcastToUser("user-1", RT_EVENTS.CALENDAR_REMOVED, payload);

      expect(mockTo).toHaveBeenCalledWith("user:user-1");
      expect(mockEmit).toHaveBeenCalledWith(
        RT_EVENTS.CALENDAR_REMOVED,
        payload,
      );
    });

    it("does nothing when server is not bound", () => {
      service.broadcastToUser("user-1", RT_EVENTS.CALENDAR_REMOVED, {
        calendarId: "cal-1",
        revision: "200",
        at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
