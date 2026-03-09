import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RequestUser } from '../../common/auth/types';

const mockService = {
  registerToken: jest.fn(),
  unregisterToken: jest.fn(),
  getTokensForUser: jest.fn(),
};

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const user: RequestUser = { id: 'user-1', email: 'test@test.com' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('register', () => {
    it('delegates to service with user id and dto', async () => {
      const dto = { token: 'ExponentPushToken[xxx]', platform: 'ios' as const };
      const expected = { id: 'tok-1', userId: 'user-1', token: 'ExponentPushToken[xxx]', platform: 'ios', createdAt: '2026-01-01T00:00:00.000Z' };
      mockService.registerToken.mockResolvedValue(expected);

      const result = await controller.register(user, dto);

      expect(result).toEqual(expected);
      expect(mockService.registerToken).toHaveBeenCalledWith(user.id, dto);
    });
  });

  describe('list', () => {
    it('returns all tokens for the current user', async () => {
      const tokens = [
        { id: 'tok-1', userId: 'user-1', token: 'ExponentPushToken[xxx]', platform: 'ios', createdAt: '2026-01-01T00:00:00.000Z' },
      ];
      mockService.getTokensForUser.mockResolvedValue(tokens);

      const result = await controller.list(user);

      expect(result).toEqual(tokens);
      expect(mockService.getTokensForUser).toHaveBeenCalledWith(user.id);
    });
  });

  describe('unregister', () => {
    it('delegates to service with user id and token id', async () => {
      mockService.unregisterToken.mockResolvedValue(undefined);

      await controller.unregister(user, 'tok-1');

      expect(mockService.unregisterToken).toHaveBeenCalledWith(user.id, 'tok-1');
    });
  });
});
