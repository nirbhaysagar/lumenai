import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Fetch recent captures
        const { data: captures, error } = await supabaseAdmin
            .from('captures')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Format for Activity Feed
        const activities = captures.map(capture => ({
            id: capture.id,
            type: capture.type, // 'url', 'pdf', 'text', etc.
            title: capture.title || 'Untitled Capture',
            timestamp: capture.created_at,
            status: capture.ingest_status, // 'processing', 'completed', 'failed'
            error: capture.error_message
        }));

        return NextResponse.json({ activities });

    } catch (error: any) {
        console.error('Activity API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
