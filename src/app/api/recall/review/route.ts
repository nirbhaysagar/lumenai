import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const mode = searchParams.get('mode');

        let query = supabaseAdmin
            .from('recall_items')
            .select(`
                id,
                content,
                memory_strength!inner(next_review_at, last_review_at)
            `)
            .eq('user_id', userId);

        if (mode === 'implicit') {
            // Implicit Mode: Surface items not due yet, prioritizing those not reviewed in a while
            // This helps "refresh" memories without formal testing
            query = query
                .gt('memory_strength.next_review_at', new Date().toISOString())
                .order('memory_strength(last_review_at)', { ascending: true, nullsFirst: true })
                .limit(3);
        } else {
            // Default Mode: Due items
            query = query
                .lte('memory_strength.next_review_at', new Date().toISOString())
                .order('memory_strength(next_review_at)', { ascending: true })
                .limit(10);
        }

        const { data: items, error } = await query;

        if (error) throw error;

        return NextResponse.json({ items: items || [] });

    } catch (error: any) {
        console.error('Fetch Recall Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { itemId, quality } = await req.json();

        if (!itemId || typeof quality !== 'number' || quality < 0 || quality > 5) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Fetch current strength AND verify ownership
        const { data: current, error: fetchError } = await supabaseAdmin
            .from('memory_strength')
            .select('*, recall_items!inner(user_id)')
            .eq('recall_item_id', itemId)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (current.recall_items.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // SuperMemo-2 Algorithm (via library)
        const { calculateSM2 } = await import('@/lib/recall/sm2');

        const { interval, easeFactor, reviewCount } = calculateSM2(
            quality,
            current.interval_days,
            current.ease_factor,
            current.review_count
        );

        // Calculate Next Review
        const next_review_at = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

        // Update DB
        const { error: updateError } = await supabaseAdmin
            .from('memory_strength')
            .update({
                interval_days: interval,
                ease_factor: easeFactor,
                review_count: reviewCount,
                next_review_at,
                last_review_at: new Date().toISOString()
            })
            .eq('recall_item_id', itemId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, next_review_at });

    } catch (error: any) {
        console.error('Review API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
