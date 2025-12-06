import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Get items due today
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const { data: dueItems, error: dueError } = await supabaseAdmin
            .from('recall_items')
            .select('id, memory_strength!inner(next_review_at)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .lte('memory_strength.next_review_at', today.toISOString());

        if (dueError) throw dueError;

        // Get total active items
        const { count: totalActive, error: totalError } = await supabaseAdmin
            .from('recall_items')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'active');

        if (totalError) throw totalError;

        // Get items reviewed today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: reviewedToday, error: reviewedError } = await supabaseAdmin
            .from('memory_strength')
            .select('recall_item_id, recall_items!inner(user_id)', { count: 'exact', head: true })
            .eq('recall_items.user_id', userId)
            .gte('last_review_at', todayStart.toISOString());

        if (reviewedError) throw reviewedError;

        // Calculate streak (consecutive days with reviews)
        // This is a simplified version - a full implementation would query review history
        const { data: recentReviews, error: streakError } = await supabaseAdmin
            .from('memory_strength')
            .select('last_review_at, recall_items!inner(user_id)')
            .eq('recall_items.user_id', userId)
            .order('last_review_at', { ascending: false })
            .limit(30);

        if (streakError) throw streakError;

        let streak = 0;
        if (recentReviews && recentReviews.length > 0) {
            const reviewDates = new Set(
                recentReviews.map(r => new Date(r.last_review_at).toDateString())
            );

            let currentDate = new Date();
            while (reviewDates.has(currentDate.toDateString())) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            }
        }

        return NextResponse.json({
            dueToday: dueItems?.length || 0,
            totalActive: totalActive || 0,
            reviewedToday: reviewedToday || 0,
            streak
        });

    } catch (error: any) {
        console.error('Recall Stats Error:', error);
        return NextResponse.json({
            error: error.message,
            dueToday: 0,
            totalActive: 0,
            reviewedToday: 0,
            streak: 0
        }, { status: 500 });
    }
}
