import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createRedisConnection } from '../lib/redis';
import { sendPush } from '../lib/push-provider';

interface ReminderJobData {
  eventId: string;
  userId: string;
  calendarId: string;
  title: string;
  fireAt: string;
}

export function createReminderWorker(redisUrl: string): Worker<ReminderJobData> {
  const connection = createRedisConnection(redisUrl);
  const prisma = new PrismaClient();

  const worker = new Worker<ReminderJobData>(
    'reminders',
    async (job: Job<ReminderJobData>) => {
      const { eventId, userId, title } = job.data;
      console.log(`[reminder] Processing reminder for event=${eventId} user=${userId}`);

      const tokens = await prisma.deviceToken.findMany({
        where: { userId },
      });

      if (tokens.length === 0) {
        console.log(`[reminder] No device tokens for user=${userId}`);
        return;
      }

      for (const dt of tokens) {
        const result = await sendPush(dt.token, dt.platform, title, `Reminder: ${title}`);

        if (result.invalidToken) {
          console.log(`[reminder] Removing invalid token id=${dt.id}`);
          await prisma.deviceToken.delete({ where: { id: dt.id } });
        }
      }
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[reminder] Job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`[reminder] Job ${job.id} completed`);
  });

  return worker;
}
