import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch concepts
        // Since we don't have a direct link to context yet in the schema (it's in metadata or global),
        // we'll fetch all concepts for now.
        // Ideally: .eq('metadata->>context_id', id)

        let query = supabaseAdmin
            .from('concepts')
            .select('*')
            .limit(10)
            .order('created_at', { ascending: false });

        // If we had user_id on concepts, we'd filter by it.
        // For now, this is a placeholder implementation using real DB data.

        const { data: concepts, error } = await query;

        if (error) {
            console.error('Error fetching concepts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ concepts });

    } catch (error: any) {
        console.error('Concepts API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
