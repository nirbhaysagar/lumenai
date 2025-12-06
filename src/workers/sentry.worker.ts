import * as Sentry from '@sentry/node';
import '@sentry/tracing';

let isInitialized = false;

/**
 * Initialize Sentry for worker processes (BullMQ workers)
 * Only initializes if SENTRY_DSN is present and ensures idempotent initialization
 */
export function initSentry() {
    if (isInitialized) {
        return Sentry;
    }

    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        console.log('⚠️  Sentry DSN not configured. Skipping worker Sentry initialization.');
        isInitialized = true;
        return Sentry;
    }

    try {
        Sentry.init({
            dsn,
            environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),

            // Tag all events as coming from workers
            initialScope: {
                tags: {
                    context: 'worker',
                    worker_type: 'bullmq',
                },
            },

            // Optional: beforeSend hook for scrubbing sensitive data
            beforeSend(event, hint) {
                // Add worker-specific context
                if (event.contexts) {
                    event.contexts.worker = {
                        type: 'bullmq',
                        pid: process.pid,
                    };
                }

                return event;
            },

            // Ignore common non-critical errors
            ignoreErrors: [
                'ECONNRESET',
                'ETIMEDOUT',
            ],
        });

        isInitialized = true;
        console.log('✅ Sentry worker initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Sentry for worker:', error);
    }

    return Sentry;
}

// Auto-initialize on import
initSentry();

// Export Sentry instance
export default Sentry;
export { Sentry };
