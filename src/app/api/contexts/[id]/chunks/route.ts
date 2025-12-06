
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/constants';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);

        const limit = parseInt(searchParams.get('limit') || '30');
        const cursor = searchParams.get('cursor'); // timestamp or seq_idx
        const query = searchParams.get('query') || '';
        const types = searchParams.get('types')?.split(',') || [];

        // Base query
        let dbQuery = supabaseAdmin
            .from('chunks')
            .select(`
                id,
                content,
                seq_idx,
                created_at,
                capture_id,
                captures!inner (
                    type,
                    title,
                    user_id
                ),
                context_chunks (
                    context_id
                )
            `);

        // If ID is 'global' or 'default', fetch all chunks for the user (via captures.user_id)
        // Note: We need to filter by user_id. Since we don't have auth middleware yet, 
        // we rely on the client passing userId in params or implicit trust for this demo.
        // Ideally, we extract userId from session.
        // For now, let's assume we filter by the hardcoded userId if 'global'.

        // Wait, the current implementation relies on `context_chunks` inner join for filtering.
        // For global, we should NOT join context_chunks strictly, or we join captures.

        if (id === 'global' || id === 'default') {
            // We need to filter by user_id. The captures!inner join allows us to filter by captures.user_id
            // But we need the userId. It's not passed in params here, usually it's in query or auth.
            // Let's check if we can get it from searchParams or if we need to update the caller.
            // The caller `useMemories` doesn't pass userId in query params currently.
            // I will update `useMemories` to pass userId, or hardcode it here for the demo consistency.
            const userId = DEMO_USER_ID; // Hardcoded for consistency
            dbQuery = dbQuery.eq('captures.user_id', userId);
        } else {
            // Specific context
            dbQuery = dbQuery
                .not('context_chunks', 'is', null) // Ensure it has a context
                .eq('context_chunks.context_id', id);
        }

        dbQuery = dbQuery
            .order('created_at', { ascending: false })
            .limit(limit);

        // Apply cursor (pagination)
        if (cursor) {
            dbQuery = dbQuery.lt('created_at', cursor);
        }

        // Apply filters
        if (types.length > 0) {
            dbQuery = dbQuery.in('captures.type', types);
        }

        // Apply text search if query exists
        if (query) {
            // Simple ILIKE for now, ideally use FTS or Vector Search
            dbQuery = dbQuery.ilike('content', `%${query}%`);
        }

        const { data: chunks, error } = await dbQuery;

        if (error) {
            console.error('Error fetching chunks:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedChunks = chunks.map((chunk: any) => ({
            id: chunk.id,
            content: chunk.content,
            preview: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
            seq_idx: chunk.seq_idx,
            capture_id: chunk.capture_id,
            type: chunk.captures?.type,
            title: chunk.captures?.title,
            created_at: chunk.created_at,
            // Mock importance/topics for now if not in DB
            importance: 0.5,
            topics: []
        }));

        const nextCursor = chunks.length === limit ? chunks[chunks.length - 1].created_at : null;

        return NextResponse.json({
            chunks: formattedChunks,
            nextCursor
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
