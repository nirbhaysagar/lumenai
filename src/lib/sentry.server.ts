import * as Sentry from '@sentry/node';
import '@sentry/tracing';

let isInitialized = false;

/**
 * Initialize Sentry for server-side (API routes, server components)
 * Only initializes if SENTRY_DSN is present and ensures idempotent initialization
 */
export function initSentry() {
    if (isInitialized) {
        return Sentry;
    }

    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        console.log('⚠️  Sentry DSN not configured. Skipping server-side Sentry initialization.');
        isInitialized = true; // Mark as initialized to prevent repeated warnings
        return Sentry;
    }

    try {
        Sentry.init({
            dsn,
            environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),

            // Optional: beforeSend hook for scrubbing sensitive data
            beforeSend(event, hint) {
                // Example: Remove sensitive headers
                if (event.request?.headers) {
                    delete event.request.headers['authorization'];
                    delete event.request.headers['cookie'];
                }

                // Example: Scrub request body if needed
                // if (event.request?.data) {
                //     event.request.data = '[Filtered]';
                // }

                return event;
            },

            // Ignore common non-critical errors
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
            ],
        });

        isInitialized = true;
        console.log('✅ Sentry server-side initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error);
    }

    return Sentry;
}

// Auto-initialize on import
initSentry();

// Export Sentry instance
export default Sentry;
export { Sentry };
