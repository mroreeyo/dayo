import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RequestUser } from '../../common/auth/types';

const mockService = {
  listEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
};

describe('EventsController', () => {
  let controller: EventsController;
  const user: RequestUser = { id: 'user-1', email: 'test@test.com' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockService }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  describe('list', () => {
    it('delegates to service with user id and query', async () => {
      const query = { calendarId: 'cal-1', from: '2026-02-01T00:00:00Z', to: '2026-03-01T00:00:00Z' };
      const expected = { items: [] };
      mockService.listEvents.mockResolvedValue(expected);

      const result = await controller.list(user, query);

      expect(result).toEqual(expected);
      expect(mockService.listEvents).toHaveBeenCalledWith(user.id, query);
    });
  });

  describe('create', () => {
    it('delegates to service with user id and dto', async () => {
      const dto = {
        calendarId: 'cal-1',
        title: 'Meeting',
        timezone: 'Asia/Seoul',
        startAtUtc: '2026-02-26T03:00:00Z',
        endAtUtc: '2026-02-26T04:00:00Z',
      };
      const expected = { ok: true, revision: '100' };
      mockService.createEvent.mockResolvedValue(expected);

      const result = await controller.create(user, dto as never);

      expect(result).toEqual(expected);
      expect(mockService.createEvent).toHaveBeenCalledWith(user.id, dto);
    });
  });

  describe('update', () => {
    it('delegates to service with user id, event id, and dto', async () => {
      const eventId = 'evt-1';
      const dto = { version: 1, title: 'Updated' };
      const expected = { ok: true, revision: '200' };
      mockService.updateEvent.mockResolvedValue(expected);

      const result = await controller.update(user, eventId, dto as never);

      expect(result).toEqual(expected);
      expect(mockService.updateEvent).toHaveBeenCalledWith(user.id, eventId, dto);
    });
  });

  describe('remove', () => {
    it('delegates to service with user id and event id', async () => {
      const eventId = 'evt-1';
      const expected = { ok: true, revision: '300' };
      mockService.deleteEvent.mockResolvedValue(expected);

      const result = await controller.remove(user, eventId);

      expect(result).toEqual(expected);
      expect(mockService.deleteEvent).toHaveBeenCalledWith(user.id, eventId);
    });
  });
});
