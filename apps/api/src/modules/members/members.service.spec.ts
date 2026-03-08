import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { MembersService } from './members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';

const mockPrisma = {
  calendarMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockPolicy = {
  authorize: jest.fn(),
};

describe('MembersService', () => {
  let service: MembersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarPolicy, useValue: mockPolicy },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  const actorId = 'user-owner';
  const adminId = 'user-admin';
  const memberId = 'user-member';
  const calendarId = 'cal-1';

  const makeUser = (id: string, email: string, nickname: string) => ({
    id,
    email,
    nickname,
    avatarUrl: null,
  });

  const makeMember = (
    userId: string,
    role: MemberRole,
    user: { id: string; email: string; nickname: string; avatarUrl: string | null },
  ) => ({
    id: `member-${userId}`,
    calendarId,
    userId,
    role,
    revision: BigInt(100),
    user,
  });

  describe('listMembers', () => {
    it('returns all members of a calendar', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      const ownerUser = makeUser(actorId, 'owner@test.com', 'Owner');
      const memberUser = makeUser(memberId, 'member@test.com', 'Member');

      mockPrisma.calendarMember.findMany.mockResolvedValue([
        makeMember(actorId, MemberRole.OWNER, ownerUser),
        makeMember(memberId, MemberRole.MEMBER, memberUser),
      ]);

      const result = await service.listMembers(actorId, calendarId);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        id: `member-${actorId}`,
        userId: actorId,
        email: 'owner@test.com',
        nickname: 'Owner',
        avatarUrl: null,
        role: MemberRole.OWNER,
        revision: '100',
      });
      expect(mockPolicy.authorize).toHaveBeenCalledWith(actorId, calendarId, MemberRole.MEMBER);
    });

    it('rejects non-member', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Not a member of this calendar'),
      );

      await expect(service.listMembers('stranger', calendarId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateRole', () => {
    it('allows OWNER to change MEMBER to ADMIN', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.OWNER });

      const targetUser = makeUser(memberId, 'member@test.com', 'Member');
      mockPrisma.calendarMember.findUnique.mockResolvedValue(
        makeMember(memberId, MemberRole.MEMBER, targetUser),
      );

      const updatedMember = makeMember(memberId, MemberRole.ADMIN, targetUser);
      mockPrisma.calendarMember.update.mockResolvedValue(updatedMember);

      const result = await service.updateRole(actorId, calendarId, memberId, {
        role: MemberRole.ADMIN,
      });

      expect(result.role).toBe(MemberRole.ADMIN);
      expect(mockPolicy.authorize).toHaveBeenCalledWith(actorId, calendarId, MemberRole.ADMIN);
    });

    it('allows ADMIN to change MEMBER role', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });

      const targetUser = makeUser(memberId, 'member@test.com', 'Member');
      mockPrisma.calendarMember.findUnique.mockResolvedValue(
        makeMember(memberId, MemberRole.MEMBER, targetUser),
      );

      const updatedMember = makeMember(memberId, MemberRole.MEMBER, targetUser);
      mockPrisma.calendarMember.update.mockResolvedValue(updatedMember);

      const result = await service.updateRole(adminId, calendarId, memberId, {
        role: MemberRole.MEMBER,
      });

      expect(result).toBeDefined();
    });

    it('rejects changing OWNER role', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.OWNER });

      const ownerUser = makeUser('other-owner', 'owner2@test.com', 'Owner2');
      mockPrisma.calendarMember.findUnique.mockResolvedValue(
        makeMember('other-owner', MemberRole.OWNER, ownerUser),
      );

      await expect(
        service.updateRole(actorId, calendarId, 'other-owner', { role: MemberRole.ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects assigning OWNER role', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.OWNER });

      const targetUser = makeUser(memberId, 'member@test.com', 'Member');
      mockPrisma.calendarMember.findUnique.mockResolvedValue(
        makeMember(memberId, MemberRole.MEMBER, targetUser),
      );

      await expect(
        service.updateRole(actorId, calendarId, memberId, { role: MemberRole.OWNER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects ADMIN assigning ADMIN role (equal to own)', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });

      const targetUser = makeUser(memberId, 'member@test.com', 'Member');
      mockPrisma.calendarMember.findUnique.mockResolvedValue(
        makeMember(memberId, MemberRole.MEMBER, targetUser),
      );

      await expect(
        service.updateRole(adminId, calendarId, memberId, { role: MemberRole.ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for non-existent target', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.OWNER });
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole(actorId, calendarId, 'ghost', { role: MemberRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects MEMBER trying to update roles', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Requires ADMIN role or higher'),
      );

      await expect(
        service.updateRole(memberId, calendarId, 'someone', { role: MemberRole.MEMBER }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('allows ADMIN to remove MEMBER', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });

      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId: memberId,
        role: MemberRole.MEMBER,
      });

      mockPrisma.calendarMember.delete.mockResolvedValue({
        revision: BigInt(200),
      });

      const result = await service.removeMember(adminId, calendarId, memberId);

      expect(result).toEqual({ ok: true, revision: '200' });
    });

    it('allows MEMBER to self-leave', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.MEMBER });

      mockPrisma.calendarMember.delete.mockResolvedValue({
        revision: BigInt(201),
      });

      const result = await service.removeMember(memberId, calendarId, memberId);

      expect(result).toEqual({ ok: true, revision: '201' });
      expect(mockPolicy.authorize).toHaveBeenCalledWith(memberId, calendarId, MemberRole.MEMBER);
    });

    it('prevents OWNER from self-leaving', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.OWNER });

      await expect(
        service.removeMember(actorId, calendarId, actorId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents ADMIN from removing OWNER', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });

      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId: actorId,
        role: MemberRole.OWNER,
      });

      await expect(
        service.removeMember(adminId, calendarId, actorId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents ADMIN from removing another ADMIN', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });

      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId: 'admin-2',
        role: MemberRole.ADMIN,
      });

      await expect(
        service.removeMember(adminId, calendarId, 'admin-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for non-existent target', async () => {
      mockPolicy.authorize.mockResolvedValue({ role: MemberRole.ADMIN });
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember(adminId, calendarId, 'ghost'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects MEMBER trying to remove another member', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new ForbiddenException('Requires ADMIN role or higher'),
      );

      await expect(
        service.removeMember(memberId, calendarId, 'someone-else'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
