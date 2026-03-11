import { Test, TestingModule } from "@nestjs/testing";
import { MemberRole } from "@prisma/client";
import { MembersController } from "./members.controller";
import { MembersService } from "./members.service";
import { RequestUser } from "../../common/auth/types";

const mockService = {
  listMembers: jest.fn(),
  updateRole: jest.fn(),
  removeMember: jest.fn(),
};

describe("MembersController", () => {
  let controller: MembersController;
  const user: RequestUser = { id: "user-1", email: "test@test.com" };
  const calendarId = "cal-1";

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [{ provide: MembersService, useValue: mockService }],
    }).compile();

    controller = module.get<MembersController>(MembersController);
  });

  describe("listMembers", () => {
    it("delegates to service with user id and calendar id", async () => {
      const expected = { items: [] };
      mockService.listMembers.mockResolvedValue(expected);

      const result = await controller.listMembers(user, calendarId);

      expect(result).toEqual(expected);
      expect(mockService.listMembers).toHaveBeenCalledWith(user.id, calendarId);
    });
  });

  describe("updateRole", () => {
    it("delegates to service with all params", async () => {
      const targetUserId = "user-2";
      const dto = { role: MemberRole.ADMIN };
      const expected = {
        id: "member-1",
        userId: targetUserId,
        email: "user2@test.com",
        nickname: "User2",
        avatarUrl: null,
        role: MemberRole.ADMIN,
        revision: "100",
      };
      mockService.updateRole.mockResolvedValue(expected);

      const result = await controller.updateRole(
        user,
        calendarId,
        targetUserId,
        dto,
      );

      expect(result).toEqual(expected);
      expect(mockService.updateRole).toHaveBeenCalledWith(
        user.id,
        calendarId,
        targetUserId,
        dto,
      );
    });
  });

  describe("removeMember", () => {
    it("delegates to service with all params", async () => {
      const targetUserId = "user-2";
      const expected = { ok: true, revision: "200" };
      mockService.removeMember.mockResolvedValue(expected);

      const result = await controller.removeMember(
        user,
        calendarId,
        targetUserId,
      );

      expect(result).toEqual(expected);
      expect(mockService.removeMember).toHaveBeenCalledWith(
        user.id,
        calendarId,
        targetUserId,
      );
    });
  });
});
