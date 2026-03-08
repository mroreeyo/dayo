import { Test, TestingModule } from '@nestjs/testing';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { RequestUser } from '../../common/auth/types';

const mockService = {
  createInvite: jest.fn(),
  joinByCode: jest.fn(),
};

describe('InvitesController', () => {
  let controller: InvitesController;
  const user: RequestUser = { id: 'user-1', email: 'test@test.com' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitesController],
      providers: [{ provide: InvitesService, useValue: mockService }],
    }).compile();

    controller = module.get<InvitesController>(InvitesController);
  });

  describe('createInvite', () => {
    it('delegates to service with user id, calendar id, and dto', async () => {
      const calendarId = 'cal-1';
      const dto = { maxUses: 10 };
      const expected = {
        invite: {
          id: 'invite-1',
          calendarId,
          code: 'abc123',
          expiresAt: null,
          maxUses: 10,
          useCount: 0,
          revision: '100',
        },
      };
      mockService.createInvite.mockResolvedValue(expected);

      const result = await controller.createInvite(user, calendarId, dto);

      expect(result).toEqual(expected);
      expect(mockService.createInvite).toHaveBeenCalledWith(user.id, calendarId, dto);
    });
  });

  describe('joinByCode', () => {
    it('delegates to service with user id and code', async () => {
      const code = 'valid-code';
      const expected = { calendarId: 'cal-1', revision: '201' };
      mockService.joinByCode.mockResolvedValue(expected);

      const result = await controller.joinByCode(user, code);

      expect(result).toEqual(expected);
      expect(mockService.joinByCode).toHaveBeenCalledWith(user.id, code);
    });
  });
});
