import { NextResponse } from 'next/server';
import { dedupQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        await dedupQueue.add('manual-trigger', {
            userId,
            scope: 'global'
        });

        console.log(`Manual deduplication triggered for user ${userId}`);

        return NextResponse.json({
            success: true,
            message: 'Cleanup job started. Check back in a few moments.'
        });
    } catch (error: any) {
        console.error('Dedup trigger error:', error);
        return NextResponse.json({
            error: 'Failed to trigger deduplication',
            details: error.message
        }, { status: 500 });
    }
}
