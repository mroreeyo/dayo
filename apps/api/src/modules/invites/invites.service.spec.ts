import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, GoneException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, MemberRole } from '@prisma/client';
import { InvitesService } from './invites.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarPolicy } from '../../libs/policies/calendar.policy';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../realtime/realtime.service';

const mockPrisma = {
  invite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  calendarMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
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

describe('InvitesService', () => {
  let service: InvitesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarPolicy, useValue: mockPolicy },
        { provide: AuditService, useValue: mockAudit },
        { provide: RealtimeService, useValue: mockRealtime },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
  });

  const userId = 'user-1';
  const calendarId = 'cal-1';
  const inviteId = 'invite-1';

  describe('createInvite', () => {
    it('creates invite with high-entropy code when user is ADMIN+', async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      mockPrisma.invite.create.mockResolvedValue({
        id: inviteId,
        calendarId,
        code: 'abc123def456ghi789jkl012mno345pq',
        expiresAt: null,
        maxUses: null,
        useCount: 0,
        revision: BigInt(100),
      });

      const result = await service.createInvite(userId, calendarId, {});

      expect(result.invite.id).toBe(inviteId);
      expect(result.invite.calendarId).toBe(calendarId);
      expect(result.invite.expiresAt).toBeNull();
      expect(result.invite.maxUses).toBeNull();
      expect(result.invite.useCount).toBe(0);
      expect(result.invite.revision).toBe('100');
      expect(mockPolicy.authorize).toHaveBeenCalledWith(userId, calendarId, MemberRole.ADMIN);
    });

    it('creates invite with expiry and maxUses', async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.OWNER,
      });

      const expiresAt = new Date('2026-04-01T00:00:00Z');
      mockPrisma.invite.create.mockResolvedValue({
        id: inviteId,
        calendarId,
        code: 'xyz789',
        expiresAt,
        maxUses: 5,
        useCount: 0,
        revision: BigInt(101),
      });

      const result = await service.createInvite(userId, calendarId, {
        expiresAt: '2026-04-01T00:00:00Z',
        maxUses: 5,
      });

      expect(result.invite.expiresAt).toBe(expiresAt.toISOString());
      expect(result.invite.maxUses).toBe(5);
    });

    it('records CREATE audit on invite creation', async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      mockPrisma.invite.create.mockResolvedValue({
        id: inviteId,
        calendarId,
        code: 'abc123def456ghi789jkl012mno345pq',
        expiresAt: null,
        maxUses: null,
        useCount: 0,
        revision: BigInt(100),
      });

      await service.createInvite(userId, calendarId, {});

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.INVITE,
        inviteId,
        AuditAction.CREATE,
        { maxUses: null, expiresAt: null },
      );
    });

    it('generates code with at least 32 characters', async () => {
      mockPolicy.authorize.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.ADMIN,
      });

      let capturedCode = '';
      mockPrisma.invite.create.mockImplementation(async (args: { data: { code: string } }) => {
        capturedCode = args.data.code;
        return {
          id: inviteId,
          calendarId,
          code: capturedCode,
          expiresAt: null,
          maxUses: null,
          useCount: 0,
          revision: BigInt(102),
        };
      });

      await service.createInvite(userId, calendarId, {});

      expect(capturedCode.length).toBeGreaterThanOrEqual(32);
    });

    it('rejects MEMBER trying to create invite', async () => {
      mockPolicy.authorize.mockRejectedValue(
        new Error('Requires ADMIN role or higher'),
      );

      await expect(
        service.createInvite(userId, calendarId, {}),
      ).rejects.toThrow('Requires ADMIN role or higher');
    });
  });

  describe('joinByCode', () => {
    const validInvite = {
      id: inviteId,
      calendarId,
      code: 'valid-code',
      expiresAt: null,
      maxUses: null,
      useCount: 0,
      revision: BigInt(200),
    };

    it('joins user to calendar as MEMBER', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(validInvite);
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

      const memberResult = {
        id: 'member-1',
        calendarId,
        userId,
        role: MemberRole.MEMBER,
        calendar: { id: calendarId, revision: BigInt(201) },
      };

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          invite: { update: jest.fn().mockResolvedValue({}) },
          calendarMember: { create: jest.fn().mockResolvedValue(memberResult) },
        });
      });

      const result = await service.joinByCode(userId, 'valid-code');

      expect(result.calendarId).toBe(calendarId);
      expect(result.revision).toBe('201');
    });

    it('records JOIN audit on successful join', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(validInvite);
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

      const memberResult = {
        id: 'member-1',
        calendarId,
        userId,
        role: MemberRole.MEMBER,
        calendar: { id: calendarId, revision: BigInt(201) },
      };

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          invite: { update: jest.fn().mockResolvedValue({}) },
          calendarMember: { create: jest.fn().mockResolvedValue(memberResult) },
        });
      });

      await service.joinByCode(userId, 'valid-code');

      expect(mockAudit.record).toHaveBeenCalledWith(
        userId,
        calendarId,
        AuditEntityType.MEMBER,
        'member-1',
        AuditAction.JOIN,
        { inviteCode: 'valid-code' },
      );
    });

    it('throws NotFoundException for invalid code', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(null);

      await expect(
        service.joinByCode(userId, 'bad-code'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws GoneException for expired invite', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        ...validInvite,
        expiresAt: new Date('2020-01-01T00:00:00Z'),
      });

      await expect(
        service.joinByCode(userId, 'valid-code'),
      ).rejects.toThrow(GoneException);
    });

    it('throws GoneException when max uses exceeded', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue({
        ...validInvite,
        maxUses: 3,
        useCount: 3,
      });

      await expect(
        service.joinByCode(userId, 'valid-code'),
      ).rejects.toThrow(GoneException);
    });

    it('throws ConflictException when already a member', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(validInvite);
      mockPrisma.calendarMember.findUnique.mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.MEMBER,
      });

      await expect(
        service.joinByCode(userId, 'valid-code'),
      ).rejects.toThrow(ConflictException);
    });

    it('increments useCount on successful join', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(validInvite);
      mockPrisma.calendarMember.findUnique.mockResolvedValue(null);

      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockCreate = jest.fn().mockResolvedValue({
        calendarId,
        userId,
        role: MemberRole.MEMBER,
        calendar: { id: calendarId, revision: BigInt(202) },
      });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          invite: { update: mockUpdate },
          calendarMember: { create: mockCreate },
        });
      });

      await service.joinByCode(userId, 'valid-code');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: inviteId },
        data: { useCount: { increment: 1 } },
      });
    });
  });
});
