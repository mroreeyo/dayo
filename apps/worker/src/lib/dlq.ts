import { Job } from "bullmq";
import { logError } from "./logger";

export interface DlqEntry {
  jobId: string | undefined;
  queue: string;
  data: unknown;
  failedReason: string | undefined;
  attemptsMade: number;
  timestamp: string;
}

const dlqStore: DlqEntry[] = [];

export function handleDlq(
  job: Job | undefined,
  err: Error,
  queueName: string,
): void {
  if (!job) return;

  const maxAttempts = job.opts?.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const entry: DlqEntry = {
    jobId: job.id,
    queue: queueName,
    data: job.data,
    failedReason: err.message,
    attemptsMade: job.attemptsMade,
    timestamp: new Date().toISOString(),
  };

  dlqStore.push(entry);

  logError(
    queueName,
    job.id,
    "dlq",
    `Job moved to DLQ after ${job.attemptsMade} attempts`,
    err,
    {
      data: job.data as Record<string, unknown>,
    },
  );
}

export function getDlqEntries(): readonly DlqEntry[] {
  return dlqStore;
}
