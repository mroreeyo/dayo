import { Test, TestingModule } from "@nestjs/testing";
import { MemberRole } from "@prisma/client";
import { CalendarsController } from "./calendars.controller";
import { CalendarsService } from "./calendars.service";
import { RequestUser } from "../../common/auth/types";

const mockService = {
  listMyCalendars: jest.fn(),
  createCalendar: jest.fn(),
  updateCalendar: jest.fn(),
  deleteCalendar: jest.fn(),
};

describe("CalendarsController", () => {
  let controller: CalendarsController;
  const user: RequestUser = { id: "user-1", email: "test@test.com" };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarsController],
      providers: [{ provide: CalendarsService, useValue: mockService }],
    }).compile();

    controller = module.get<CalendarsController>(CalendarsController);
  });

  describe("listMyCalendars", () => {
    it("delegates to service with user id", async () => {
      const expected = { items: [] };
      mockService.listMyCalendars.mockResolvedValue(expected);

      const result = await controller.listMyCalendars(user);

      expect(result).toEqual(expected);
      expect(mockService.listMyCalendars).toHaveBeenCalledWith(user.id);
    });
  });

  describe("create", () => {
    it("delegates to service with user id and dto", async () => {
      const dto = { name: "Family", color: "#FF0000" };
      const expected = {
        id: "cal-1",
        name: "Family",
        color: "#FF0000",
        role: MemberRole.OWNER,
        revision: "1",
      };
      mockService.createCalendar.mockResolvedValue(expected);

      const result = await controller.create(user, dto);

      expect(result).toEqual(expected);
      expect(mockService.createCalendar).toHaveBeenCalledWith(user.id, dto);
    });
  });

  describe("update", () => {
    it("delegates to service with user id, calendar id, and dto", async () => {
      const calendarId = "cal-1";
      const dto = { name: "Updated" };
      const expected = {
        id: calendarId,
        name: "Updated",
        color: null,
        role: MemberRole.ADMIN,
        revision: "10",
      };
      mockService.updateCalendar.mockResolvedValue(expected);

      const result = await controller.update(user, calendarId, dto);

      expect(result).toEqual(expected);
      expect(mockService.updateCalendar).toHaveBeenCalledWith(
        user.id,
        calendarId,
        dto,
      );
    });
  });

  describe("remove", () => {
    it("delegates to service with user id and calendar id", async () => {
      const calendarId = "cal-1";
      const expected = { ok: true, revision: "50" };
      mockService.deleteCalendar.mockResolvedValue(expected);

      const result = await controller.remove(user, calendarId);

      expect(result).toEqual(expected);
      expect(mockService.deleteCalendar).toHaveBeenCalledWith(
        user.id,
        calendarId,
      );
    });
  });
});
