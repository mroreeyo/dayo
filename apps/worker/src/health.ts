import { createServer, IncomingMessage, ServerResponse } from 'http';

const startTime = Date.now();

export function startHealthCheck(port: number = 8081): void {
  const server = createServer((_req: IncomingMessage, res: ServerResponse) => {
    const uptimeMs = Date.now() - startTime;
    const body = JSON.stringify({
      status: 'ok',
      uptime: uptimeMs,
      queues: ['reminders', 'maintenance'],
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  });

  server.listen(port, () => {
    process.stdout.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      queue: 'health',
      jobId: undefined,
      status: 'started',
      message: `Health check listening on port ${port}`,
    }) + '\n');
  });
}
