import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing context ID' }, { status: 400 });
        }

        // 1. Fetch Context
        const { data: context, error: contextError } = await supabaseAdmin
            .from('contexts')
            .select('*')
            .eq('id', id)
            .single();

        if (contextError) throw contextError;

        // 2. Fetch Related Chunks (via context_chunks)
        const { data: chunks, error: chunksError } = await supabaseAdmin
            .from('context_chunks')
            .select('chunk_id, chunks(*, captures(title, pinned))')
            .eq('context_id', id)
            .limit(50); // Limit for performance

        // 3. Fetch Direct Captures (Notes created in this context)
        const { data: directCaptures, error: capturesError } = await supabaseAdmin
            .from('captures')
            .select('*')
            .eq('context_id', id)
            .order('created_at', { ascending: false });

        // 4. Fetch Summaries
        const { data: summaries, error: summariesError } = await supabaseAdmin
            .from('summaries')
            .select('*')
            .eq('target_id', id)
            .eq('target_type', 'context')
            .order('created_at', { ascending: false });

        // Merge chunks and direct captures
        // Map captures to chunk-like structure for frontend compatibility
        const mappedCaptures = (directCaptures || []).map(c => ({
            id: c.id,
            content: c.raw_text,
            capture_id: c.id,
            captures: { title: c.title, pinned: c.pinned },
            created_at: c.created_at,
            is_capture: true,
            pinned: c.pinned // Top level for easier access
        }));

        const allItems = [
            ...mappedCaptures,
            ...(chunks?.map(c => c.chunks) || [])
        ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({
            context,
            chunks: allItems,
            summaries: summaries || []
        });
    } catch (error) {
        console.error('Get context error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing context ID' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('contexts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete context error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, description, pinned } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing context ID' }, { status: 400 });
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (pinned !== undefined) updates.pinned = pinned;

        const { data, error } = await supabaseAdmin
            .from('contexts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, context: data });
    } catch (error) {
        console.error('Update context error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
