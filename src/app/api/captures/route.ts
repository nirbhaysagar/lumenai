import { NextResponse } from 'next/server';
// Force rebuild
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const teamId = searchParams.get('teamId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        let query = supabaseAdmin
            .from('captures')
            .select('*, chunks(count)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (teamId) {
            // Check membership? (Optional for admin client but good for logic)
            // Ideally we rely on RLS but supabaseAdmin bypasses it.
            // For MVP assume client sending valid teamId for user.
            query = query.eq('team_id', teamId);
        } else {
            // Personal
            query = query.eq('user_id', userId).is('team_id', null);
        }

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Allow fetching single capture by ID
        const id = searchParams.get('id');
        if (id) {
            const { data: capture, error } = await supabaseAdmin
                .from('captures')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return NextResponse.json({ capture });
        }

        if (q) {
            query = query.ilike('title', `%${q}%`);
        }

        const { data: captures, error } = await query;

        if (error) throw error;

        // Transform to flatten chunk count
        const formattedCaptures = captures.map((c: any) => ({
            ...c,
            chunk_count: c.chunks?.[0]?.count || 0
        }));

        return NextResponse.json({ captures: formattedCaptures });
    } catch (error: any) {
        console.error('Failed to fetch captures:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, type, raw_text, title, context_id, visible_in_rag, team_id } = body;

        if (!user_id || !type || !raw_text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('captures')
            .insert({
                user_id,
                type,
                raw_text,
                title: title || 'Untitled Capture',
                context_id: context_id || null,
                visible_in_rag: visible_in_rag ?? true,
                ingest_status: 'processed', // Auto-process for now
                team_id: team_id || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, capture: data });
    } catch (error: any) {
        console.error('Failed to create capture:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const ids = id.split(',');

        const { error } = await supabaseAdmin
            .from('captures')
            .delete()
            .in('id', ids);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete capture:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        // 1. Fetch current capture to save version if content changes
        if (updates.raw_text || updates.content) {
            const { data: currentCapture, error: fetchError } = await supabaseAdmin
                .from('captures')
                .select('*')
                .eq('id', id)
                .single();

            if (!fetchError && currentCapture) {
                // Save current version
                await supabaseAdmin
                    .from('capture_versions')
                    .insert({
                        capture_id: id,
                        content: currentCapture.raw_text || currentCapture.content || '',
                        created_by: currentCapture.user_id
                    });
            }
        }

        const { data, error } = await supabaseAdmin
            .from('captures')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, capture: data });
    } catch (error: any) {
        console.error('Failed to update capture:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
