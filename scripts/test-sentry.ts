/**
 * Test script to trigger a Sentry exception in a worker
 * 
 * This will:
 * 1. Enqueue a job with invalid data
 * 2. Worker will fail and send exception to Sentry
 * 3. Verify Sentry captured the error with breadcrumbs
 */

import { Queue } from 'bullmq';
import { getRedisConnection } from '../src/lib/redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connection = getRedisConnection();

async function testSentryException() {
    console.log('🧪 Testing Sentry Exception Capture in Worker...\n');

    // Test 1: Trigger error in summarizer worker
    console.log('1️⃣ Triggering error in Summarizer Worker...');
    const summarizerQueue = new Queue('summarizer', { connection });

    await summarizerQueue.add('test-error', {
        userId: 'test-user-id',
        contextId: 'invalid-context-id-that-does-not-exist',
        // This will cause the worker to fail when trying to fetch chunks
    });

    console.log('   ✅ Job enqueued. Worker will process and fail.');
    console.log('   📊 Check Sentry dashboard for the exception.');

    // Test 2: Trigger error in task extractor worker
    console.log('\n2️⃣ Triggering error in Task Extractor Worker...');
    const taskQueue = new Queue('task_extractor', { connection });

    await taskQueue.add('test-error', {
        userId: 'test-user-id',
        messageId: 'invalid-message-id-that-does-not-exist',
        contextId: null,
        // This will cause the worker to fail when trying to fetch the message
    });

    console.log('   ✅ Job enqueued. Worker will process and fail.');
    console.log('   📊 Check Sentry dashboard for the exception.');

    // Test 3: Trigger a custom exception
    console.log('\n3️⃣ Triggering custom exception in Embeddings Worker...');
    const embeddingsQueue = new Queue('embeddings', { connection });

    await embeddingsQueue.add('test-error', {
        chunkId: 'test-chunk-id',
        userId: 'test-user-id',
        // Worker will fail when chunk is not found
    });

    console.log('   ✅ Job enqueued. Worker will process and fail.');
    console.log('   📊 Check Sentry dashboard for the exception.');

    console.log('\n✨ Test jobs enqueued successfully!');
    console.log('\n📋 What to check in Sentry:');
    console.log('   1. Go to your Sentry dashboard');
    console.log('   2. Look for new errors in the last few minutes');
    console.log('   3. Verify the error includes:');
    console.log('      - Stack trace');
    console.log('      - Worker context (pid, type)');
    console.log('      - Breadcrumbs showing job processing steps');
    console.log('      - Tags: context=worker, worker_type=bullmq');
    console.log('      - Extra data: jobId, userId, etc.');

    console.log('\n⏳ Wait 10-15 seconds for workers to process...');

    // Close queues
    await summarizerQueue.close();
    await taskQueue.close();
    await embeddingsQueue.close();

    process.exit(0);
}

testSentryException().catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
});
