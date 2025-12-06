import { supabaseAdmin } from '@/lib/supabase';
import { digestQueue } from '@/lib/queue';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response('Missing userId', { status: 400 });
    }

    try {
        // Fetch notifications of type 'digest'
        const { data: digests, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'digest')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return new Response(JSON.stringify({ digests }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Failed to fetch digests:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return new Response('Missing userId', { status: 400 });
        }

        // Trigger Queue
        await digestQueue.add('generate-digest', { userId });

        return new Response(JSON.stringify({ success: true, message: 'Digest generation queued' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Failed to trigger digest:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
