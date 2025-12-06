import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response('Missing userId', { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('recall_items')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'suggested')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { itemId, action } = await req.json(); // action: 'accept' | 'dismiss'

        if (!itemId || !action) {
            return new Response('Missing required fields', { status: 400 });
        }

        let updateData: any = {};

        if (action === 'accept') {
            updateData = { status: 'active' };
            // Trigger worker to generate Q&A if needed (optional, but good for immediate processing)
            // For now, we just mark it active. The daily job will pick it up or we can trigger explicit recall job.

            // Let's trigger the explicit recall job to generate Q&A immediately
            // Let's trigger the explicit recall job to generate Q&A immediately
            const { recallQueue } = await import('@/lib/queue');

            // Fetch content first
            const { data: item } = await supabaseAdmin.from('recall_items').select('content, user_id').eq('id', itemId).single();

            if (item) {
                await recallQueue.add('explicit_recall', {
                    type: 'explicit',
                    userId: item.user_id,
                    content: item.content,
                    recallItemId: itemId
                });
            }

        } else if (action === 'dismiss') {
            updateData = { status: 'dismissed' };
        } else {
            return new Response('Invalid action', { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('recall_items')
            .update(updateData)
            .eq('id', itemId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Failed to update suggestion:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
