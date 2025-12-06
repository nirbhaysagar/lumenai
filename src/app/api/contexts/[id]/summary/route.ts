import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        let query = supabaseAdmin
            .from('summaries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (id === 'global' || id === 'default') {
            // For global, we might want a "Global Summary" (context_id is null?)
            // Or we just return null for now as we don't have a global summary generator yet.
            // Let's try to find a summary where context_id is NULL (if we store global summaries there)
            // OR just return the latest summary across all contexts? No, that's confusing.
            // Let's assume global summaries have context_id = null or we return nothing for now.
            query = query.is('context_id', null);
        } else {
            query = query.eq('context_id', id);
        }

        const { data: summaries, error } = await query;

        if (error) throw error;

        return NextResponse.json({ summary: summaries?.[0] || null });
    } catch (error: any) {
        console.error('Failed to fetch summary:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
