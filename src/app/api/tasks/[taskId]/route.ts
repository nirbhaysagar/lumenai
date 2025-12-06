
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = await params;
    try {
        const updates = await req.json();

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, task: data });
    } catch (error: any) {
        console.error('Failed to update task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = await params;
    try {
        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
