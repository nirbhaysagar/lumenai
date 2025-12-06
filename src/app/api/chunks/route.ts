import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/chunks
 * Fetches chunks for a given capture
 * Query params:
 *   - captureId: required, the capture ID
 *   - limit: optional, max number of chunks (default: 10)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const captureId = searchParams.get('captureId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!captureId) {
        return NextResponse.json({ error: 'Missing captureId' }, { status: 400 });
    }

    try {
        const { data: chunks, error } = await supabaseAdmin
            .from('chunks')
            .select('id, content, metadata, created_at')
            .eq('capture_id', captureId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ chunks: chunks || [] });
    } catch (error: any) {
        console.error('Failed to fetch chunks:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
