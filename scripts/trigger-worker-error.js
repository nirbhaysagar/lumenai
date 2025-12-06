/**
 * Script to trigger a worker error for Sentry testing
 * This enqueues a job that will intentionally fail to test worker error capture
 * 
 * Usage: node scripts/trigger-worker-error.js
 */

const { Queue } = require('bullmq');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

async function triggerWorkerError() {
    console.log('🧪 Triggering worker error for Sentry testing...');

    const embeddingsQueue = new Queue('embeddings-queue', { connection });

    try {
        // Enqueue a job with a special flag to trigger an error
        const job = await embeddingsQueue.add('test-error', {
            willFail: true,
            chunkId: 'test-error-chunk-id',
            content: 'This job is designed to fail for Sentry testing',
        });

        console.log(`✅ Error test job enqueued: ${job.id}`);
        console.log('📊 Check your worker logs and Sentry dashboard for the error event.');
        console.log('');
        console.log('Expected behavior:');
        console.log('1. Worker should process the job');
        console.log('2. Worker should detect willFail flag and throw an error');
        console.log('3. Error should be captured by Sentry');
        console.log('4. Event should appear in Sentry dashboard with worker context');

    } catch (error) {
        console.error('❌ Failed to enqueue error test job:', error);
    } finally {
        await embeddingsQueue.close();
        process.exit(0);
    }
}

triggerWorkerError();
