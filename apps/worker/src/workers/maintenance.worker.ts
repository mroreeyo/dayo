import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { createRedisConnection } from "../lib/redis";
import { logInfo, logWarn, logError } from "../lib/logger";
import { handleDlq } from "../lib/dlq";

const QUEUE_NAME = "maintenance";

interface MaintenanceJobData {
  task: "CLEAN_AUDIT" | "CLEAN_EXPIRED_INVITES" | "CLEAN_STALE_TOKENS";
}

export function createMaintenanceWorker(
  redisUrl: string,
): Worker<MaintenanceJobData> {
  const connection = createRedisConnection(redisUrl);
  const prisma = new PrismaClient();

  const worker = new Worker<MaintenanceJobData>(
    QUEUE_NAME,
    async (job: Job<MaintenanceJobData>) => {
      const { task } = job.data;
      logInfo(QUEUE_NAME, job.id, "processing", `Running task: ${task}`);

      switch (task) {
        case "CLEAN_AUDIT": {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          const result = await prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
          });
          logInfo(
            QUEUE_NAME,
            job.id,
            "cleaned",
            `Deleted ${result.count} audit logs older than 90 days`,
          );
          break;
        }

        case "CLEAN_EXPIRED_INVITES": {
          const now = new Date();
          const result = await prisma.invite.deleteMany({
            where: { expiresAt: { lt: now } },
          });
          logInfo(
            QUEUE_NAME,
            job.id,
            "cleaned",
            `Deleted ${result.count} expired invites`,
          );
          break;
        }

        case "CLEAN_STALE_TOKENS": {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          const result = await prisma.deviceToken.deleteMany({
            where: { updatedAt: { lt: cutoff } },
          });
          logInfo(
            QUEUE_NAME,
            job.id,
            "cleaned",
            `Deleted ${result.count} stale device tokens`,
          );
          break;
        }

        default:
          logWarn(QUEUE_NAME, job.id, "unknown_task", `Unknown task: ${task}`);
      }
    },
    {
      connection,
      concurrency: 1,
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

export const maintenanceJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
};
