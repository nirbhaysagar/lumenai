import { Sentry } from './sentry.server';
import { NextResponse } from 'next/server';

/**
 * Wrapper for Next.js API route handlers to automatically capture exceptions
 * and flush Sentry before rethrowing (critical for serverless environments)
 * 
 * @param fn - The API route handler function
 * @returns Wrapped function with Sentry error capture and flush
 * 
 * @example
 * export const GET = withSentry(async (req: Request) => {
 *   // Your route logic
 *   return NextResponse.json({ data: 'success' });
 * });
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
    fn: T
): T {
    return (async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            // Capture exception with Sentry
            Sentry.captureException(error, {
                tags: {
                    handler: 'api_route',
                },
                extra: {
                    args: args.map((arg, i) => {
                        // Safely serialize Request objects
                        if (arg instanceof Request) {
                            return {
                                url: arg.url,
                                method: arg.method,
                                headers: Object.fromEntries(arg.headers.entries()),
                            };
                        }
                        return arg;
                    }),
                },
            });

            // Flush Sentry to ensure event is sent before serverless function terminates
            // This is critical in serverless environments where the process may be killed
            await Sentry.flush(2000);

            // Rethrow to allow Next.js error handling
            throw error;
        }
    }) as T;
}

/**
 * Wrapper specifically for API routes that need to return error responses
 * instead of throwing
 * 
 * @example
 * export const POST = withSentryErrorResponse(async (req: Request) => {
 *   // Your route logic
 * });
 */
export function withSentryErrorResponse<T extends (...args: any[]) => Promise<NextResponse>>(
    fn: T
): T {
    return (async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            // Capture exception
            Sentry.captureException(error, {
                tags: {
                    handler: 'api_route_error_response',
                },
            });

            // Flush Sentry
            await Sentry.flush(2000);

            // Return error response instead of throwing
            return NextResponse.json(
                {
                    error: error instanceof Error ? error.message : 'Internal server error',
                },
                { status: 500 }
            );
        }
    }) as T;
}
