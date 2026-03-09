import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createRedisConnection } from '../lib/redis';

interface MaintenanceJobData {
  task: 'CLEAN_AUDIT' | 'CLEAN_EXPIRED_INVITES' | 'CLEAN_STALE_TOKENS';
}

export function createMaintenanceWorker(redisUrl: string): Worker<MaintenanceJobData> {
  const connection = createRedisConnection(redisUrl);
  const prisma = new PrismaClient();

  const worker = new Worker<MaintenanceJobData>(
    'maintenance',
    async (job: Job<MaintenanceJobData>) => {
      const { task } = job.data;
      console.log(`[maintenance] Running task: ${task}`);

      switch (task) {
        case 'CLEAN_AUDIT': {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          const result = await prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
          });
          console.log(`[maintenance] Deleted ${result.count} audit logs older than 90 days`);
          break;
        }

        case 'CLEAN_EXPIRED_INVITES': {
          const now = new Date();
          const result = await prisma.invite.deleteMany({
            where: { expiresAt: { lt: now } },
          });
          console.log(`[maintenance] Deleted ${result.count} expired invites`);
          break;
        }

        case 'CLEAN_STALE_TOKENS': {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          const result = await prisma.deviceToken.deleteMany({
            where: { updatedAt: { lt: cutoff } },
          });
          console.log(`[maintenance] Deleted ${result.count} stale device tokens`);
          break;
        }

        default:
          console.warn(`[maintenance] Unknown task: ${task}`);
      }
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[maintenance] Job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`[maintenance] Job ${job.id} completed`);
  });

  return worker;
}
