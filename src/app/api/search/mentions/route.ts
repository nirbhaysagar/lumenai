import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const userId = searchParams.get('userId'); // Optional, for filtering by user

    // if (!q || q.length < 2) {
    //     return NextResponse.json({ results: [] });
    // }

    try {
        let contextsQuery = supabaseAdmin.from('contexts').select('id, name, description').limit(5);
        let capturesQuery = supabaseAdmin.from('captures').select('id, title, raw_text').limit(5);
        let conceptsQuery = supabaseAdmin.from('concepts').select('id, label, description').limit(5);

        if (q) {
            contextsQuery = contextsQuery.ilike('name', `%${q}%`);
            capturesQuery = capturesQuery.ilike('title', `%${q}%`);
            conceptsQuery = conceptsQuery.ilike('label', `%${q}%`);
        } else {
            // Default to recent/popular if no query
            contextsQuery = contextsQuery.order('created_at', { ascending: false });
            capturesQuery = capturesQuery.order('created_at', { ascending: false });
        }

        const [
            { data: contexts },
            { data: captures },
            { data: concepts }
        ] = await Promise.all([
            contextsQuery,
            capturesQuery,
            conceptsQuery
        ]);

        // Format results
        const results = [
            ...(contexts || []).map((c: any) => ({
                id: c.id,
                label: c.name,
                type: 'context',
                description: c.description
            })),
            ...(captures || []).map((c: any) => ({
                id: c.id,
                label: c.title || 'Untitled Memory',
                type: 'memory',
                description: c.raw_text?.slice(0, 50)
            })),
            ...(concepts || []).map((c: any) => ({
                id: c.id,
                label: c.label,
                type: 'concept',
                description: c.description
            }))
        ];

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Search mentions error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
