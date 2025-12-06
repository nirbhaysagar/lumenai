import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import after env vars are loaded
import { supabaseAdmin } from '../lib/supabase';
import { generateEmbeddings } from '../lib/embeddings';
// import * as Sentry from '@sentry/node';
// import { addBreadcrumb } from '../lib/sentryHelpers';

console.log('🚀 Starting Embeddings Worker...');

export const processEmbeddingsJob = async (job: any) => {
    const { chunkId, userId, captureId, type, willFail } = job.data;
    console.log(`Processing chunk ${chunkId} for capture ${captureId}`);

    // Add breadcrumb for debugging
    // addBreadcrumb('Processing embeddings job', {
    //     chunkId,
    //     captureId,
    //     jobId: job.id,
    // });

    // Test error handling for Sentry verification
    if (willFail) {
        throw new Error('Intentional worker error for Sentry testing (willFail flag detected)');
    }

    try {
        // 1. Fetch Chunk Content
        console.log(`[Embeddings] Fetching chunk ${chunkId}...`);
        const { data: chunk, error: chunkError } = await supabaseAdmin
            .from('chunks')
            .select('content')
            .eq('id', chunkId)
            .single();

        if (chunkError || !chunk) {
            throw new Error(`Chunk not found: ${chunkError?.message}`);
        }
        console.log(`[Embeddings] Chunk fetched. Content length: ${chunk.content.length}`);

        // 2. Generate Embedding
        console.log(`[Embeddings] Generating embedding...`);
        const embedding = await generateEmbeddings(chunk.content);
        console.log(`[Embeddings] Embedding generated. Length: ${embedding.length}`);

        // 3. Store Vector
        console.log(`[Embeddings] Storing vector...`);
        const { error: insertError } = await supabaseAdmin
            .from('chunk_vectors')
            .insert({
                chunk_id: chunkId,
                user_id: userId,
                embedding,
                metadata: {
                    capture_id: captureId,
                    type,
                }
            });

        if (insertError) {
            throw new Error(`Vector insert failed: ${insertError.message}`);
        }
        console.log(`[Embeddings] Vector stored.`);

        // 4. Update Chunk Status (Optional metadata update)
        await supabaseAdmin
            .from('chunks')
            .update({
                metadata: { embed_status: 'completed', processed_at: new Date().toISOString() }
            })
            .eq('id', chunkId);

        console.log(`✅ Completed chunk ${chunkId}`);

        // Check if all chunks for this capture are done to update capture status
        // (Simplified: Just mark capture as completed if it was 'processing')
        await supabaseAdmin
            .from('captures')
            .update({ ingest_status: 'completed' })
            .eq('id', captureId)
            .eq('ingest_status', 'processing');

        // Trigger Deduplication (L2)
        // We trigger this per chunk, but dedup worker processes in batches/clusters.
        // Ideally, we might want to wait for all chunks, but for now, triggering it ensures it runs.
        console.log(`[Embeddings] Triggering Dedup...`);
        const { dedupQueue } = await import('../lib/queue');
        await dedupQueue.add('dedup_chunk', { userId });
        console.log(`Triggered Dedup for user ${userId}`);

    } catch (error: any) {
        console.error(`❌ Failed chunk ${chunkId}:`, error.message);
        throw error;
    }
};

export const startEmbeddingsWorker = () => {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
    });
    const worker = new Worker('embeddings-queue', processEmbeddingsJob, { connection });

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', async (job, err) => {
        console.error(`Job ${job?.id} failed: ${err.message}`);

        // Capture worker failures with Sentry
        // Sentry.captureException(err, {
        //     tags: {
        //         worker: 'embeddings',
        //         jobId: job?.id,
        //     },
        //     extra: {
        //         jobData: job?.data,
        //         attemptsMade: job?.attemptsMade,
        //     },
        // });

        // Update Capture Status in DB
        if (job?.data?.captureId) {
            try {
                await supabaseAdmin
                    .from('captures')
                    .update({
                        ingest_status: 'failed',
                        error_message: err.message,
                        failure_reason: 'worker_error'
                    })
                    .eq('id', job.data.captureId);
                console.log(`Marked capture ${job.data.captureId} as failed.`);
            } catch (dbError) {
                console.error('Failed to update capture error status:', dbError);
            }
        }
    });

    return worker;
};
