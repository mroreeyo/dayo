import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_NAMES } from "../../libs/jobs/queue-names";
import { ReminderJobData } from "../../libs/jobs/job-types";

@Injectable()
export class QueuesService implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly reminderQueue: Queue<ReminderJobData>;
  private readonly maintenanceQueue: Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    this.reminderQueue = new Queue<ReminderJobData>(QUEUE_NAMES.REMINDER, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    this.maintenanceQueue = new Queue(QUEUE_NAMES.MAINTENANCE, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  async enqueueReminder(data: ReminderJobData): Promise<void> {
    const delay = Math.max(0, new Date(data.fireAt).getTime() - Date.now());
    const jobId = `reminder:${data.eventId}`;

    await this.reminderQueue.add("send-reminder", data, {
      jobId,
      delay,
    });
  }

  async cancelReminder(eventId: string): Promise<void> {
    const jobId = `reminder:${eventId}`;
    const job = await this.reminderQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.reminderQueue.close();
    await this.maintenanceQueue.close();
    await this.connection.quit();
  }
}
