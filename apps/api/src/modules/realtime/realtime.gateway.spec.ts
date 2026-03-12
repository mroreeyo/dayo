import { Test, TestingModule } from "@nestjs/testing";
import { WsException } from "@nestjs/websockets";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";
import * as wsGuard from "./realtime.ws-guard";

const mockRealtimeService = {
  bindServer: jest.fn(),
  joinCalendarRoom: jest.fn(),
  broadcast: jest.fn(),
  broadcastToUser: jest.fn(),
};

describe("RealtimeGateway", () => {
  let gateway: RealtimeGateway;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  describe("afterInit", () => {
    it("binds server to RealtimeService", () => {
      const mockServer = {} as never;
      gateway.afterInit(mockServer);
      expect(mockRealtimeService.bindServer).toHaveBeenCalledWith(mockServer);
    });
  });

  describe("handleConnection", () => {
    it("joins user room on valid JWT", async () => {
      jest.spyOn(wsGuard, "verifyWsToken").mockReturnValue({
        id: "user-1",
        email: "test@test.com",
      });

      const mockClient = {
        handshake: { auth: { token: "valid-token" } },
        data: {} as Record<string, unknown>,
        join: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockClient.data.user).toEqual({
        id: "user-1",
        email: "test@test.com",
      });
      expect(mockClient.join).toHaveBeenCalledWith("user:user-1");
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it("disconnects client on invalid JWT", async () => {
      jest.spyOn(wsGuard, "verifyWsToken").mockReturnValue(null);

      const mockClient = {
        handshake: { auth: {} },
        data: {} as Record<string, unknown>,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it("disconnects client when no token provided", async () => {
      jest.spyOn(wsGuard, "verifyWsToken").mockReturnValue(null);

      const mockClient = {
        handshake: { auth: {}, headers: {} },
        data: {} as Record<string, unknown>,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe("joinCalendar", () => {
    it("joins calendar room when user is a member", async () => {
      mockRealtimeService.joinCalendarRoom.mockResolvedValue(undefined);

      const mockClient = {
        data: { user: { id: "user-1", email: "test@test.com" } },
      };

      const result = await gateway.joinCalendar(mockClient as never, {
        calendarId: "cal-1",
      });

      expect(mockRealtimeService.joinCalendarRoom).toHaveBeenCalledWith(
        mockClient,
        "user-1",
        "cal-1",
      );
      expect(result).toEqual({ ok: true });
    });

    it("throws WsException when user data is missing", async () => {
      const mockClient = { data: {} };

      await expect(
        gateway.joinCalendar(mockClient as never, { calendarId: "cal-1" }),
      ).rejects.toThrow(WsException);
    });

    it("propagates WsException when not a member", async () => {
      mockRealtimeService.joinCalendarRoom.mockRejectedValue(
        new WsException("Not a member of this calendar"),
      );

      const mockClient = {
        data: { user: { id: "user-1", email: "test@test.com" } },
      };

      await expect(
        gateway.joinCalendar(mockClient as never, { calendarId: "cal-1" }),
      ).rejects.toThrow(WsException);
    });
  });

  describe("leaveCalendar", () => {
    it("leaves calendar room", async () => {
      const mockClient = {
        leave: jest.fn().mockResolvedValue(undefined),
        data: { user: { id: "user-1", email: "test@test.com" } },
      };

      const result = await gateway.leaveCalendar(mockClient as never, {
        calendarId: "cal-1",
      });

      expect(mockClient.leave).toHaveBeenCalledWith("calendar:cal-1");
      expect(result).toEqual({ ok: true });
    });
  });
});
