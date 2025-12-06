'use client';

import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Initialize Sentry for client-side (browser)
 * Only initializes in browser environment and if DSN is present
 */
export function initSentry() {
    // Only run in browser
    if (typeof window === 'undefined') {
        return Sentry;
    }

    if (isInitialized) {
        return Sentry;
    }

    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

    if (!dsn) {
        console.log('⚠️  Sentry DSN not configured. Skipping client-side Sentry initialization.');
        isInitialized = true;
        return Sentry;
    }

    try {
        Sentry.init({
            dsn,
            environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || 'development',
            tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0'),
            // BrowserTracing is automatically included in newer versions of @sentry/react
            // No need to manually add it to integrations

            // Optional: beforeSend hook for scrubbing sensitive data
            beforeSend(event, hint) {
                // Example: Remove sensitive data from breadcrumbs
                if (event.breadcrumbs) {
                    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                        if (breadcrumb.category === 'console' && breadcrumb.message?.includes('password')) {
                            return { ...breadcrumb, message: '[Filtered]' };
                        }
                        return breadcrumb;
                    });
                }

                return event;
            },

            // Ignore common non-critical errors
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
                'Network request failed',
            ],
        });

        isInitialized = true;
        console.log('✅ Sentry client-side initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error);
    }

    return Sentry;
}

// Auto-initialize on import (only in browser)
if (typeof window !== 'undefined') {
    initSentry();
}

// Export Sentry instance
export default Sentry;
export { Sentry };
