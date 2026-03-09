import 'dotenv/config';
import { createReminderWorker } from './workers/reminder.worker';
import { createMaintenanceWorker } from './workers/maintenance.worker';
import { startHealthCheck } from './health';
import { logInfo } from './lib/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const healthPort = parseInt(process.env.HEALTH_PORT || '8081', 10);

logInfo('system', undefined, 'starting', 'Worker starting...');
createReminderWorker(redisUrl);
createMaintenanceWorker(redisUrl);
startHealthCheck(healthPort);
logInfo('system', undefined, 'running', 'Workers running');
