import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { createRedisConnection } from "../lib/redis";
import { sendPush } from "../lib/push-provider";
import { logInfo, logWarn, logError } from "../lib/logger";
import { handleDlq } from "../lib/dlq";

const QUEUE_NAME = "reminders";

interface ReminderJobData {
  eventId: string;
  userId: string;
  calendarId: string;
  title: string;
  fireAt: string;
}

export function createReminderWorker(
  redisUrl: string,
): Worker<ReminderJobData> {
  const connection = createRedisConnection(redisUrl);
  const prisma = new PrismaClient();

  const worker = new Worker<ReminderJobData>(
    QUEUE_NAME,
    async (job: Job<ReminderJobData>) => {
      const { eventId, userId, title } = job.data;
      logInfo(
        QUEUE_NAME,
        job.id,
        "processing",
        `Processing reminder for event=${eventId} user=${userId}`,
      );

      const tokens = await prisma.deviceToken.findMany({
        where: { userId },
      });

      if (tokens.length === 0) {
        logWarn(
          QUEUE_NAME,
          job.id,
          "no_tokens",
          `No device tokens for user=${userId}`,
        );
        return;
      }

      for (const dt of tokens) {
        const result = await sendPush(
          dt.token,
          dt.platform,
          title,
          `Reminder: ${title}`,
        );

        if (result.invalidToken) {
          logWarn(
            QUEUE_NAME,
            job.id,
            "invalid_token",
            `Removing invalid token id=${dt.id}`,
          );
          await prisma.deviceToken.delete({ where: { id: dt.id } });
        }
      }
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    logError(QUEUE_NAME, job?.id, "failed", `Job ${job?.id} failed`, err);
    handleDlq(job, err, QUEUE_NAME);
  });

  worker.on("completed", (job) => {
    logInfo(QUEUE_NAME, job.id, "completed", `Job ${job.id} completed`);
  });

  return worker;
}

export const reminderJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
};
