import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const { data: notifications, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json({ notifications });
    } catch (error: any) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, is_read } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to update notification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
