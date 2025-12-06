import { NextResponse } from 'next/server';
import { taskExtractorQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const { userId, contextId, chunkIds } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        await taskExtractorQueue.add('extract-tasks', {
            userId,
            contextId,
            chunkIds,
            source: 'api'
        });

        return NextResponse.json({ success: true, message: 'Task extraction queued' });

    } catch (error: any) {
        console.error('Task Agent Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
