import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  deviceToken: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  const userId = 'user-1';
  const tokenId = 'tok-1';

  const deviceToken = {
    id: tokenId,
    userId,
    token: 'ExponentPushToken[abc]',
    platform: 'ios',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('registerToken', () => {
    it('creates a new device token', async () => {
      mockPrisma.deviceToken.findUnique.mockResolvedValue(null);
      mockPrisma.deviceToken.create.mockResolvedValue(deviceToken);

      const result = await service.registerToken(userId, {
        token: 'ExponentPushToken[abc]',
        platform: 'ios',
      });

      expect(result.id).toBe(tokenId);
      expect(result.token).toBe('ExponentPushToken[abc]');
      expect(result.platform).toBe('ios');
      expect(mockPrisma.deviceToken.create).toHaveBeenCalledWith({
        data: { userId, token: 'ExponentPushToken[abc]', platform: 'ios' },
      });
    });

    it('updates existing token if token string already exists', async () => {
      mockPrisma.deviceToken.findUnique.mockResolvedValue(deviceToken);
      mockPrisma.deviceToken.update.mockResolvedValue({
        ...deviceToken,
        userId: 'user-2',
      });

      const result = await service.registerToken('user-2', {
        token: 'ExponentPushToken[abc]',
        platform: 'ios',
      });

      expect(result.userId).toBe('user-2');
      expect(mockPrisma.deviceToken.update).toHaveBeenCalledWith({
        where: { id: tokenId },
        data: { userId: 'user-2', platform: 'ios' },
      });
    });
  });

  describe('unregisterToken', () => {
    it('deletes a device token owned by the user', async () => {
      mockPrisma.deviceToken.findFirst.mockResolvedValue(deviceToken);
      mockPrisma.deviceToken.delete.mockResolvedValue(deviceToken);

      await service.unregisterToken(userId, tokenId);

      expect(mockPrisma.deviceToken.delete).toHaveBeenCalledWith({
        where: { id: tokenId },
      });
    });

    it('throws 404 when token not found', async () => {
      mockPrisma.deviceToken.findFirst.mockResolvedValue(null);

      await expect(
        service.unregisterToken(userId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when token belongs to another user', async () => {
      mockPrisma.deviceToken.findFirst.mockResolvedValue(null);

      await expect(
        service.unregisterToken('other-user', tokenId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTokensForUser', () => {
    it('returns all tokens for a user', async () => {
      const secondToken = {
        ...deviceToken,
        id: 'tok-2',
        token: 'ExponentPushToken[def]',
        platform: 'android',
      };
      mockPrisma.deviceToken.findMany.mockResolvedValue([deviceToken, secondToken]);

      const result = await service.getTokensForUser(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(tokenId);
      expect(result[1].id).toBe('tok-2');
      expect(mockPrisma.deviceToken.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns empty array when user has no tokens', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);

      const result = await service.getTokensForUser(userId);

      expect(result).toEqual([]);
    });
  });
});
