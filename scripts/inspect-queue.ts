import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('REDIS_URL:', process.env.REDIS_URL?.substring(0, 20) + '...');

    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
    });

    const q = new Queue('graph-queue', { connection });

    console.log('Queue name:', q.name);

    const waiting = await q.getWaiting();
    const active = await q.getActive();
    const delayed = await q.getDelayed();
    const failed = await q.getFailed();
    const completed = await q.getCompleted();

    console.log('waiting:', waiting.length, 'active:', active.length, 'delayed:', delayed.length, 'failed:', failed.length, 'completed:', completed.length);
    console.log('First waiting job IDs:', waiting.slice(0, 5).map(j => j.id));

    if (waiting.length > 0) {
        console.log('\nFirst waiting job data:', JSON.stringify(waiting[0].data, null, 2));
    }

    if (failed.length > 0) {
        console.log('\nFailed jobs:');
        failed.slice(0, 3).forEach(j => {
            console.log(`  Job ${j.id}:`, j.failedReason);
        });
    }

    await q.close();
    process.exit(0);
}

main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
