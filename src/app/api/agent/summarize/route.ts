import { NextResponse } from 'next/server';
import { summarizerQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const { contextId, chunkIds, userId } = await req.json();

        // Basic validation
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }
        if (!contextId && (!chunkIds || chunkIds.length === 0)) {
            return NextResponse.json({ error: 'Provide contextId or chunkIds' }, { status: 400 });
        }

        // Add job to queue
        const job = await summarizerQueue.add('summarize', {
            contextId,
            chunkIds,
            userId
        });

        return NextResponse.json({
            success: true,
            jobId: job.id,
            message: 'Summary generation started'
        });

    } catch (error) {
        console.error('Summarizer API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const { data: summaries, error } = await supabaseAdmin
            .from('summaries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ summaries });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
