import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/constants';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('userId') || DEMO_USER_ID; // Hardcoded for now

    if (!query) {
        return NextResponse.json({
            commands: [],
            contexts: [],
            captures: [],
            memories: [],
        });
    }

    try {
        // Parallel search
        const [contextsRes, capturesRes] = await Promise.all([
            supabaseAdmin
                .from('contexts')
                .select('id, name, description')
                .eq('user_id', userId)
                .ilike('name', `%${query}%`)
                .limit(5),
            supabaseAdmin
                .from('captures')
                .select('id, title, type, created_at, status')
                .eq('user_id', userId)
                .ilike('title', `%${query}%`)
                .limit(5),
        ]);

        return NextResponse.json({
            commands: [], // Handled client-side for now, or could serve dynamic commands
            contexts: contextsRes.data || [],
            captures: capturesRes.data || [],
            memories: [], // Vector search to be added in Phase 2
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
