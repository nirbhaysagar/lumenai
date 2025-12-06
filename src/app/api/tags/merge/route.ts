import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { sourceId, targetId } = await req.json();

        if (!sourceId || !targetId) {
            return NextResponse.json({ error: 'Source and Target IDs are required' }, { status: 400 });
        }

        if (sourceId === targetId) {
            return NextResponse.json({ error: 'Cannot merge tag into itself' }, { status: 400 });
        }

        // 1. Get all chunks associated with Source Tag
        const { data: sourceLinks, error: sourceError } = await supabaseAdmin
            .from('chunk_tags')
            .select('chunk_id')
            .eq('tag_id', sourceId);

        if (sourceError) throw sourceError;

        // 2. Get all chunks associated with Target Tag (to check for duplicates)
        const { data: targetLinks, error: targetError } = await supabaseAdmin
            .from('chunk_tags')
            .select('chunk_id')
            .eq('tag_id', targetId);

        if (targetError) throw targetError;

        const targetChunkIds = new Set(targetLinks?.map(l => l.chunk_id));
        const chunksToMove: string[] = [];
        const chunksToDeleteLink: string[] = [];

        sourceLinks?.forEach(link => {
            if (targetChunkIds.has(link.chunk_id)) {
                // Chunk already has target tag, so just remove the source link
                chunksToDeleteLink.push(link.chunk_id);
            } else {
                // Chunk doesn't have target tag, so move it
                chunksToMove.push(link.chunk_id);
            }
        });

        // 3. Perform Updates
        // A. Delete redundant links (where chunk already has target)
        if (chunksToDeleteLink.length > 0) {
            const { error: delError } = await supabaseAdmin
                .from('chunk_tags')
                .delete()
                .eq('tag_id', sourceId)
                .in('chunk_id', chunksToDeleteLink);

            if (delError) throw delError;
        }

        // B. Move remaining links to target
        if (chunksToMove.length > 0) {
            const { error: moveError } = await supabaseAdmin
                .from('chunk_tags')
                .update({ tag_id: targetId })
                .eq('tag_id', sourceId)
                .in('chunk_id', chunksToMove);

            if (moveError) throw moveError;
        }

        // 4. Delete Source Tag
        // (Any remaining links should have been handled above, but cascade would catch them if we missed any)
        const { error: deleteTagError } = await supabaseAdmin
            .from('tags')
            .delete()
            .eq('id', sourceId);

        if (deleteTagError) throw deleteTagError;

        return NextResponse.json({ success: true, moved: chunksToMove.length, merged: chunksToDeleteLink.length });

    } catch (error: any) {
        console.error('Merge tags error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
