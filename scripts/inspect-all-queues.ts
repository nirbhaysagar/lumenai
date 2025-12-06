import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
    });

    const dedupQueue = new Queue('dedup-queue', { connection });
    const graphQueue = new Queue('graph-queue', { connection });

    console.log('=== DEDUP QUEUE ===');
    const dedupWaiting = await dedupQueue.getWaiting();
    const dedupActive = await dedupQueue.getActive();
    const dedupCompleted = await dedupQueue.getCompleted();
    const dedupFailed = await dedupQueue.getFailed();

    console.log('waiting:', dedupWaiting.length, 'active:', dedupActive.length, 'completed:', dedupCompleted.length, 'failed:', dedupFailed.length);

    if (dedupCompleted.length > 0) {
        console.log('Last completed job:', dedupCompleted[0].id, dedupCompleted[0].returnvalue);
    }

    if (dedupFailed.length > 0) {
        console.log('Failed jobs:', dedupFailed.slice(0, 3).map(j => ({ id: j.id, reason: j.failedReason })));
    }

    console.log('\n=== GRAPH QUEUE ===');
    const graphWaiting = await graphQueue.getWaiting();
    const graphActive = await graphQueue.getActive();
    const graphCompleted = await graphQueue.getCompleted();
    const graphFailed = await graphQueue.getFailed();

    console.log('waiting:', graphWaiting.length, 'active:', graphActive.length, 'completed:', graphCompleted.length, 'failed:', graphFailed.length);

    if (graphWaiting.length > 0) {
        console.log('First waiting job:', graphWaiting[0].id, graphWaiting[0].data);
    }

    if (graphFailed.length > 0) {
        console.log('Failed jobs:', graphFailed.slice(0, 3).map(j => ({ id: j.id, reason: j.failedReason })));
    }

    await connection.quit();
    process.exit(0);
}

main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
