import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing capture ID' }, { status: 400 });
        }

        const { data: versions, error } = await supabaseAdmin
            .from('capture_versions')
            .select('*')
            .eq('capture_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ versions });
    } catch (error: any) {
        console.error('Fetch versions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { versionId } = await req.json();

        if (!id || !versionId) {
            return NextResponse.json({ error: 'Missing ID or versionId' }, { status: 400 });
        }

        // 1. Fetch the version content
        const { data: version, error: versionError } = await supabaseAdmin
            .from('capture_versions')
            .select('content')
            .eq('id', versionId)
            .single();

        if (versionError || !version) {
            throw new Error('Version not found');
        }

        // 2. Update the capture with version content (this will trigger a new version save via PATCH logic if we called PATCH, but here we do direct update to avoid loop or we can just let it version the "bad" state)
        // Let's just update directly.
        // Actually, restoring IS an edit, so we SHOULD save the current state before restoring.
        // But since we are doing this manually, let's just update.
        // Wait, if we use the PATCH endpoint logic, it handles versioning.
        // But here we are in a specific route.
        // Let's manually save current state as version before restoring, to be safe.

        // 2a. Save current state
        const { data: currentCapture } = await supabaseAdmin
            .from('captures')
            .select('*')
            .eq('id', id)
            .single();

        if (currentCapture) {
            await supabaseAdmin
                .from('capture_versions')
                .insert({
                    capture_id: id,
                    content: currentCapture.raw_text || currentCapture.content || '',
                    created_by: currentCapture.user_id
                });
        }

        // 3. Restore content
        const { data, error } = await supabaseAdmin
            .from('captures')
            .update({ raw_text: version.content })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, capture: data });
    } catch (error: any) {
        console.error('Restore version error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
