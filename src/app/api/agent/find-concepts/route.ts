import { NextResponse } from 'next/server';
import { topicerQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const { userId, contextId, chunkIds } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        await topicerQueue.add('find-concepts', {
            userId,
            contextId,
            chunkIds,
            source: 'api'
        });

        return NextResponse.json({ success: true, message: 'Concept discovery queued' });

    } catch (error: any) {
        console.error('Concept Agent Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
