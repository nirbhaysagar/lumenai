// Initialize Sentry for workers BEFORE importing other modules
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Sentry for workers
const dsn = process.env.SENTRY_DSN;
if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
        initialScope: {
            tags: {
                context: 'worker',
                worker_type: 'bullmq',
            },
        },
        beforeSend(event) {
            if (event.contexts) {
                event.contexts.worker = {
                    type: 'bullmq',
                    pid: process.pid,
                };
            }
            return event;
        },
        ignoreErrors: ['ECONNRESET', 'ETIMEDOUT'],
    });
    console.log('✅ Sentry worker initialized');
} else {
    console.log('⚠️  Sentry DSN not configured. Skipping worker Sentry initialization.');
}

(async () => {
    try {
        const { startEmbeddingsWorker } = await import('./embeddings.worker');
        startEmbeddingsWorker();

        const { startTopicerWorker } = await import('./topicer.worker');
        startTopicerWorker();

        const { startDedupWorker } = await import('./dedup.worker');
        startDedupWorker();

        const { startSummarizerWorker } = await import('./summarizer.worker');
        startSummarizerWorker();

        const { startTaskExtractorWorker } = await import('./task_extractor.worker');
        startTaskExtractorWorker();

        const { startGraphWorker } = await import('./graph.worker');
        startGraphWorker();

        const { startRecallWorker } = await import('./recall.worker');
        startRecallWorker();

        const { startIngestWorker } = await import('./ingest.worker');
        startIngestWorker();

        const { startDigestWorker } = await import('./digest.worker');
        startDigestWorker();

        console.log('✅ All workers initialized and listening for jobs...');
    } catch (error) {
        console.error('❌ Failed to initialize workers:', error);

        // Capture worker initialization errors with Sentry
        Sentry.captureException(error, {
            tags: {
                context: 'worker_initialization',
            },
        });

        // Flush and exit
        await Sentry.flush(2000);
        process.exit(1);
    }
})();

// Keep process alive
setInterval(() => { }, 1000);

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});
