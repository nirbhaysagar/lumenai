import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: tags, error } = await supabaseAdmin
            .from('tags')
            .select('*, chunk_tags(count)')
            .order('name', { ascending: true });

        if (error) throw error;

        // Format response to flatten the count
        const formattedTags = tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            count: tag.chunk_tags[0]?.count || 0,
            created_at: tag.created_at
        }));

        return NextResponse.json({ tags: formattedTags });
    } catch (error: any) {
        console.error('Fetch tags error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tags')
            .insert({ name })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ tag: data });
    } catch (error: any) {
        console.error('Create tag error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
