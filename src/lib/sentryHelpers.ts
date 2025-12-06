/**
 * Helper utilities for Sentry error tracking and breadcrumbs
 * Safe to use even if Sentry is not initialized (no-op)
 */

import * as Sentry from '@sentry/node';

/**
 * Check if Sentry is initialized
 */
function isSentryInitialized(): boolean {
    try {
        return !!process.env.SENTRY_DSN;
    } catch {
        return false;
    }
}

/**
 * Add a breadcrumb to Sentry for debugging context
 * Safe no-op if Sentry is not initialized
 * 
 * @param message - Breadcrumb message
 * @param data - Optional additional data
 * 
 * @example
 * addBreadcrumb('User clicked submit button', { userId: '123' });
 */
export function addBreadcrumb(
    message: string,
    data?: Record<string, any>
): void {
    if (!isSentryInitialized()) return;

    try {
        Sentry.addBreadcrumb({
            message,
            level: 'info',
            data,
            timestamp: Date.now() / 1000,
        });
    } catch (error) {
        console.warn('Failed to add Sentry breadcrumb:', error);
    }
}

/**
 * Capture an exception with Sentry
 * Safe no-op if Sentry is not initialized
 * 
 * @param error - Error to capture
 * @param extra - Optional additional context
 * 
 * @example
 * captureException(new Error('Something went wrong'), { userId: '123' });
 */
export function captureException(
    error: Error | unknown,
    extra?: Record<string, any>
): void {
    if (!isSentryInitialized()) {
        console.error('Sentry not available, logging error:', error);
        return;
    }

    try {
        Sentry.captureException(error, {
            extra,
        });
    } catch (err) {
        console.warn('Failed to capture exception with Sentry:', err);
        console.error('Original error:', error);
    }
}

/**
 * Capture a message with Sentry
 * Safe no-op if Sentry is not initialized
 * 
 * @param message - Message to capture
 * @param level - Severity level
 * @param extra - Optional additional context
 * 
 * @example
 * captureMessage('User performed unusual action', 'warning', { userId: '123' });
 */
export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    extra?: Record<string, any>
): void {
    if (!isSentryInitialized()) return;

    try {
        Sentry.captureMessage(message, {
            level,
            extra,
        });
    } catch (error) {
        console.warn('Failed to capture message with Sentry:', error);
    }
}

/**
 * Set user context for Sentry
 * Safe no-op if Sentry is not initialized
 * 
 * @param user - User information
 * 
 * @example
 * setUser({ id: '123', email: 'user@example.com' });
 */
export function setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
} | null): void {
    if (!isSentryInitialized()) return;

    try {
        Sentry.setUser(user);
    } catch (error) {
        console.warn('Failed to set Sentry user:', error);
    }
}

/**
 * Set custom tags for Sentry
 * Safe no-op if Sentry is not initialized
 * 
 * @param tags - Tags to set
 * 
 * @example
 * setTags({ feature: 'chat', model: 'gpt-4' });
 */
export function setTags(tags: Record<string, string>): void {
    if (!isSentryInitialized()) return;

    try {
        Sentry.setTags(tags);
    } catch (error) {
        console.warn('Failed to set Sentry tags:', error);
    }
}
