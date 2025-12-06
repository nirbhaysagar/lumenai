import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { userId, name, description } = await req.json();

        if (!userId || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('contexts')
            .insert({ user_id: userId, name, description })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, context: data });
    } catch (error) {
        console.error('Create context error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('contexts')
            .select('*, context_chunks(count)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedContexts = data.map((ctx: any) => ({
            ...ctx,
            chunk_count: ctx.context_chunks?.[0]?.count || 0
        }));

        return NextResponse.json(formattedContexts);
    } catch (error) {
        console.error('List contexts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
