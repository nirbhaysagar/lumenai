import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { contextId, chunkIds } = await req.json();

        if (!contextId || !chunkIds || !Array.isArray(chunkIds)) {
            return NextResponse.json({ error: 'Missing required fields or invalid chunkIds' }, { status: 400 });
        }

        const inserts = chunkIds.map(chunkId => ({
            context_id: contextId,
            chunk_id: chunkId
        }));

        const { error } = await supabaseAdmin
            .from('context_chunks')
            .insert(inserts);

        if (error) throw error;

        return NextResponse.json({ success: true, count: chunkIds.length });
    } catch (error) {
        console.error('Assign context error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
