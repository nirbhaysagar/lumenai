import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/constants';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const contextId = searchParams.get('contextId');
        const limit = parseInt(searchParams.get('limit') || '5');
        const userId = DEMO_USER_ID; // Hardcoded for now

        if (!contextId) {
            return NextResponse.json({ error: 'Missing contextId' }, { status: 400 });
        }

        // 1. Get the most recent chunk to use as a "seed"
        let query = supabaseAdmin
            .from('chunks')
            .select('embedding, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (contextId !== 'global' && contextId !== 'default') {
            query = query.eq('context_id', contextId);
        }

        const { data: seedChunk, error: seedError } = await query.single();

        if (seedError || !seedChunk) {
            // No memories yet, return empty
            return NextResponse.json({ chunks: [] });
        }

        // 2. Find related chunks using the seed embedding
        const { data: relatedChunks, error: matchError } = await supabaseAdmin.rpc('match_chunks', {
            query_embedding: seedChunk.embedding,
            match_threshold: 0.5,
            match_count: limit + 1, // Fetch one extra to filter out the seed itself
            filter_user_id: userId,
            filter_context_id: (contextId === 'global' || contextId === 'default') ? null : contextId,
            filter_capture_id: null
        });

        if (matchError) {
            console.error('Vector search error:', matchError);
            return NextResponse.json({ error: matchError.message }, { status: 500 });
        }

        // Filter out the seed chunk if present (by content similarity or ID if we had it)
        // Since we didn't select ID for seed, let's just return the top matches.
        // Ideally we filter out the exact same chunk.

        const formattedChunks = relatedChunks.map((chunk: any) => ({
            id: chunk.id,
            content: chunk.content,
            similarity: chunk.similarity,
            created_at: chunk.created_at,
            source_type: chunk.metadata?.type || 'text',
            metadata: chunk.metadata
        }));

        return NextResponse.json({ chunks: formattedChunks });

    } catch (error: any) {
        console.error('Related API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
