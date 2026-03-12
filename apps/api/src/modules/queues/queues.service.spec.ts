import { QueuesService } from "./queues.service";

const mockAdd = jest.fn().mockResolvedValue(undefined);
const mockGetJob = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockAdd,
    getJob: mockGetJob,
    close: mockClose,
  })),
}));

const mockQuit = jest.fn().mockResolvedValue("OK");

jest.mock("ioredis", () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    quit: mockQuit,
    status: "ready",
  }));
  return { __esModule: true, default: MockRedis };
});

describe("QueuesService", () => {
  let service: QueuesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QueuesService();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe("enqueueReminder", () => {
    it("adds a job with delay based on fireAt", async () => {
      const fireAt = new Date(Date.now() + 60_000).toISOString();

      await service.enqueueReminder({
        eventId: "evt-1",
        userId: "user-1",
        calendarId: "cal-1",
        title: "Meeting",
        fireAt,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        "send-reminder",
        expect.objectContaining({ eventId: "evt-1", title: "Meeting" }),
        expect.objectContaining({
          jobId: "reminder:evt-1",
          delay: expect.any(Number),
        }),
      );

      const actualDelay = mockAdd.mock.calls[0][2].delay;
      expect(actualDelay).toBeGreaterThan(0);
      expect(actualDelay).toBeLessThanOrEqual(60_000);
    });

    it("sets delay to 0 when fireAt is in the past", async () => {
      const fireAt = new Date(Date.now() - 10_000).toISOString();

      await service.enqueueReminder({
        eventId: "evt-2",
        userId: "user-1",
        calendarId: "cal-1",
        title: "Past event",
        fireAt,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        "send-reminder",
        expect.anything(),
        expect.objectContaining({ delay: 0 }),
      );
    });
  });

  describe("cancelReminder", () => {
    it("removes existing job by jobId", async () => {
      const mockRemove = jest.fn().mockResolvedValue(undefined);
      mockGetJob.mockResolvedValue({ remove: mockRemove });

      await service.cancelReminder("evt-1");

      expect(mockGetJob).toHaveBeenCalledWith("reminder:evt-1");
      expect(mockRemove).toHaveBeenCalled();
    });

    it("does nothing when job does not exist", async () => {
      mockGetJob.mockResolvedValue(null);

      await service.cancelReminder("evt-nonexistent");

      expect(mockGetJob).toHaveBeenCalledWith("reminder:evt-nonexistent");
    });
  });

  describe("onModuleDestroy", () => {
    it("closes queues and connection", async () => {
      await service.onModuleDestroy();

      expect(mockClose).toHaveBeenCalledTimes(2);
      expect(mockQuit).toHaveBeenCalled();
    });
  });
});
