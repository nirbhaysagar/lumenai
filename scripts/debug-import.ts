import * as dotenv from 'dotenv';
import path from 'path';
import { Queue } from 'bullmq';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
console.log('Start');
console.log('BullMQ Queue imported:', !!Queue);
console.log('End');
