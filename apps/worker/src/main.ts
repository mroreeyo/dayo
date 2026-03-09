import 'dotenv/config';
import { createReminderWorker } from './workers/reminder.worker';
import { createMaintenanceWorker } from './workers/maintenance.worker';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('Worker starting...');
createReminderWorker(redisUrl);
createMaintenanceWorker(redisUrl);
console.log('Workers running');
