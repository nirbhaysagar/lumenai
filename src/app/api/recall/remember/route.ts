import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { userId, chunkId, conceptId, note, tag } = await req.json();

        if (!userId || (!chunkId && !conceptId)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate next review date (default 1 day)
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + 1);

        // 1. Create Recall Item
        const { data: item, error: itemError } = await supabaseAdmin
            .from('recall_items')
            .insert({
                user_id: userId,
                chunk_id: chunkId || null,
                concept_id: conceptId || null,
                metadata: { note, tag }
            })
            .select()
            .single();

        if (itemError) throw itemError;

        // 2. Initialize Memory Strength (SRS)
        const { error: strengthError } = await supabaseAdmin
            .from('memory_strength')
            .insert({
                recall_item_id: item.id,
                stability: 1.0,
                difficulty: 1.0,
                last_review_at: new Date().toISOString(),
                next_review_at: nextReviewAt.toISOString(),
                review_count: 0
            });

        if (strengthError) throw strengthError;

        return NextResponse.json({ success: true, item });

    } catch (error: any) {
        console.error('Create Recall Item error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
