import { NextResponse } from 'next/server';
import { withSentry } from '@/lib/sentryNextWrapper';

/**
 * Test endpoint to verify Sentry server-side error capture
 * This endpoint intentionally throws an error to test Sentry integration
 * 
 * Usage: GET http://localhost:3000/api/sentry-test
 */
export const GET = withSentry(async (req: Request) => {
    console.log('🧪 Sentry test endpoint called');

    // Intentionally throw an error to test Sentry capture
    throw new Error('Test error from Sentry test endpoint - this is intentional!');

    // This line will never be reached
    return NextResponse.json({ message: 'This should not be returned' });
});
