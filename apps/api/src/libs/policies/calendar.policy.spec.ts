import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { MemberRole } from "@prisma/client";
import { CalendarPolicy } from "./calendar.policy";
import { PrismaService } from "../../prisma/prisma.service";

const mockPrisma = {
  calendar: { findUnique: jest.fn() },
  calendarMember: { findUnique: jest.fn() },
};

describe("CalendarPolicy", () => {
  let policy: CalendarPolicy;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarPolicy,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    policy = module.get<CalendarPolicy>(CalendarPolicy);
  });

  const calendarId = "cal-1";
  const userId = "user-1";

  it("throws NotFoundException when calendar does not exist", async () => {
    mockPrisma.calendar.findUnique.mockResolvedValue(null);

    await expect(
      policy.authorize(userId, calendarId, MemberRole.MEMBER),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws ForbiddenException when user is not a member", async () => {
    mockPrisma.calendar.findUnique.mockResolvedValue({ id: calendarId });
    mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

    await expect(
      policy.authorize(userId, calendarId, MemberRole.MEMBER),
    ).rejects.toThrow(ForbiddenException);
  });

  it("throws ForbiddenException when role is insufficient", async () => {
    mockPrisma.calendar.findUnique.mockResolvedValue({ id: calendarId });
    mockPrisma.calendarMember.findUnique.mockResolvedValue({
      calendarId,
      userId,
      role: MemberRole.MEMBER,
    });

    await expect(
      policy.authorize(userId, calendarId, MemberRole.ADMIN),
    ).rejects.toThrow(ForbiddenException);
  });

  it("returns member when OWNER meets ADMIN requirement", async () => {
    const member = { calendarId, userId, role: MemberRole.OWNER };
    mockPrisma.calendar.findUnique.mockResolvedValue({ id: calendarId });
    mockPrisma.calendarMember.findUnique.mockResolvedValue(member);

    const result = await policy.authorize(userId, calendarId, MemberRole.ADMIN);

    expect(result).toEqual(member);
  });

  it("returns member when role exactly matches requirement", async () => {
    const member = { calendarId, userId, role: MemberRole.ADMIN };
    mockPrisma.calendar.findUnique.mockResolvedValue({ id: calendarId });
    mockPrisma.calendarMember.findUnique.mockResolvedValue(member);

    const result = await policy.authorize(userId, calendarId, MemberRole.ADMIN);

    expect(result).toEqual(member);
  });

  it("MEMBER cannot satisfy OWNER requirement", async () => {
    mockPrisma.calendar.findUnique.mockResolvedValue({ id: calendarId });
    mockPrisma.calendarMember.findUnique.mockResolvedValue({
      calendarId,
      userId,
      role: MemberRole.MEMBER,
    });

    await expect(
      policy.authorize(userId, calendarId, MemberRole.OWNER),
    ).rejects.toThrow(ForbiddenException);
  });

  it("ADMIN cannot satisfy OWNER requirement", async () => {
    mockPrisma.calendar.findUnique.mockResolvedValue({ id: calendarId });
    mockPrisma.calendarMember.findUnique.mockResolvedValue({
      calendarId,
      userId,
      role: MemberRole.ADMIN,
    });

    await expect(
      policy.authorize(userId, calendarId, MemberRole.OWNER),
    ).rejects.toThrow(ForbiddenException);
  });
});
