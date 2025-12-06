// import { Queue } from 'bullmq';
// import IORedis from 'ioredis';

// Mock Queue for testing without Redis
class MockQueue {
    name: string;
    constructor(name: string, opts?: any) {
        this.name = name;
        console.log(`[MockQueue] Initialized ${name}`);
    }

    async add(jobName: string, data: any) {
        console.log(`[MockQueue ${this.name}] Added job: ${jobName}`);

        // Execute the job logic directly (fire and forget to avoid blocking response)
        this.processJob(jobName, data).catch(err => {
            console.error(`[MockQueue ${this.name}] Job failed:`, err);
        });

        return { id: 'mock-job-id-' + Date.now() };
    }

    async processJob(jobName: string, data: any) {
        console.log(`[MockQueue ${this.name}] Processing job...`);

        try {
            if (this.name === 'ingest-queue') {
                const { processIngestJob } = await import('@/workers/ingest.worker');
                await processIngestJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'embeddings-queue') {
                const { processEmbeddingsJob } = await import('@/workers/embeddings.worker');
                await processEmbeddingsJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'topicer-queue') {
                const { processTopicerJob } = await import('@/workers/topicer.worker');
                await processTopicerJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'dedup-queue') {
                const { processDedupJob } = await import('@/workers/dedup.worker');
                await processDedupJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'summarizer-queue') {
                const { processSummarizerJob } = await import('@/workers/summarizer.worker');
                await processSummarizerJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'task-extractor-queue') {
                const { processTaskExtractorJob } = await import('@/workers/task_extractor.worker');
                await processTaskExtractorJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'graph-queue') {
                const { processGraphJob } = await import('@/workers/graph.worker');
                await processGraphJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'recall-queue') {
                const { processRecallJob } = await import('@/workers/recall.worker');
                await processRecallJob({ data, id: 'mock-job-' + Date.now() } as any);
            }
            else if (this.name === 'digest') {
                const { processDigestJob } = await import('@/workers/digest.worker');
                await processDigestJob({ data, id: 'mock-job-' + Date.now() } as any);
            }

            console.log(`[MockQueue ${this.name}] Job completed successfully`);
        } catch (error) {
            console.error(`[MockQueue ${this.name}] Error processing job:`, error);
        }
    }
}

// const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
//     maxRetriesPerRequest: null,
// });

const connection = null;

export const embeddingsQueue = new MockQueue('embeddings-queue', { connection }) as any;
export const topicerQueue = new MockQueue('topicer-queue', { connection }) as any;
export const dedupQueue = new MockQueue('dedup-queue', { connection }) as any;
export const summarizerQueue = new MockQueue('summarizer-queue', { connection }) as any;
export const taskExtractorQueue = new MockQueue('task-extractor-queue', { connection }) as any;
export const graphQueue = new MockQueue('graph-queue', { connection }) as any;
export const recallQueue = new MockQueue('recall-queue', { connection }) as any;
export const ingestQueue = new MockQueue('ingest-queue', { connection }) as any;
export const digestQueue = new MockQueue('digest', { connection }) as any;



