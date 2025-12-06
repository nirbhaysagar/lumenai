import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/constants';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        let query = supabaseAdmin
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (id === 'global' || id === 'default') {
            const userId = DEMO_USER_ID;
            query = query.eq('user_id', userId);
        } else {
            query = query.eq('context_id', id);
        }

        const { data: tasks, error } = await query;

        if (error) throw error;

        return NextResponse.json({ tasks });
    } catch (error: any) {
        console.error('Failed to fetch tasks:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { content, priority, status } = await req.json();
        const userId = DEMO_USER_ID; // Hardcoded

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                content,
                priority: priority || 'medium',
                status: status || 'pending',
                context_id: id === 'global' ? null : id,
                user_id: userId
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, task: data });
    } catch (error: any) {
        console.error('Failed to create task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
