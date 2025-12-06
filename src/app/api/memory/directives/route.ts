import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        let query = supabaseAdmin
            .from('memory_directives')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data: directives, error } = await query;

        if (error) throw error;

        return NextResponse.json({ directives });
    } catch (error: any) {
        console.error('Get directives error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, targetType, targetId, triggerType, triggerValue, action, priority } = body;

        if (!userId || !targetType || !targetId || !triggerType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('memory_directives')
            .insert({
                user_id: userId,
                target_type: targetType,
                target_id: targetId,
                trigger_type: triggerType,
                trigger_value: triggerValue,
                action: action || 'surface',
                priority: priority || 'medium',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, directive: data });
    } catch (error: any) {
        console.error('Create directive error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
