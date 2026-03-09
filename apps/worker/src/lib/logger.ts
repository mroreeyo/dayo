export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  queue: string;
  jobId: string | undefined;
  status: string;
  message: string;
  error?: string;
  stack?: string;
  data?: Record<string, unknown>;
}

function emit(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  if (entry.level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export function logInfo(queue: string, jobId: string | undefined, status: string, message: string, data?: Record<string, unknown>): void {
  emit({ timestamp: new Date().toISOString(), level: 'info', queue, jobId, status, message, data });
}

export function logWarn(queue: string, jobId: string | undefined, status: string, message: string, data?: Record<string, unknown>): void {
  emit({ timestamp: new Date().toISOString(), level: 'warn', queue, jobId, status, message, data });
}

export function logError(queue: string, jobId: string | undefined, status: string, message: string, err?: Error, data?: Record<string, unknown>): void {
  emit({
    timestamp: new Date().toISOString(),
    level: 'error',
    queue,
    jobId,
    status,
    message,
    error: err?.message,
    stack: err?.stack,
    data,
  });
}
