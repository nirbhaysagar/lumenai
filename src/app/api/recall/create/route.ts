import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        // Get request body
        const { userId, chunkId, memoryId, content, note, delayDays } = await req.json();

        if (!userId || (!chunkId && !memoryId) || !content) {
            return NextResponse.json({
                error: 'Missing required fields: userId, (chunkId or memoryId), content'
            }, { status: 400 });
        }

        // Validate delayDays
        const delay = parseInt(delayDays) || 1;
        if (delay < 1 || delay > 365) {
            return NextResponse.json({
                error: 'delayDays must be between 1 and 365'
            }, { status: 400 });
        }

        // Check for duplicates - prevent marking the same chunk/memory twice
        let existing;
        if (chunkId) {
            const { data, error: checkError } = await supabaseAdmin
                .from('recall_items')
                .select('id')
                .eq('user_id', userId)
                .eq('source_chunk_id', chunkId)
                .eq('status', 'active')
                .maybeSingle();

            if (checkError) {
                console.error('Error checking for duplicates:', checkError);
                throw checkError;
            }
            existing = data;
        } else if (memoryId) {
            // Check if memory is already in recall by checking metadata
            const { data: allItems, error: checkError } = await supabaseAdmin
                .from('recall_items')
                .select('id, metadata')
                .eq('user_id', userId)
                .eq('status', 'active');

            if (checkError) {
                console.error('Error checking for duplicates:', checkError);
                throw checkError;
            }

            // Filter items that have this memoryId in metadata
            existing = allItems?.find(item => item.metadata?.memoryId === memoryId);
        }

        if (existing) {
            return NextResponse.json({
                error: chunkId ? 'This chunk is already marked for recall' : 'This memory is already marked for recall',
                itemId: existing.id
            }, { status: 409 });
        }

        // Calculate next review date
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + delay);

        // Create recall item
        const recallItemData: any = {
            user_id: userId,
            content: content,
            recall_type: 'explicit',
            status: 'active',
            metadata: note ? { note } : {}
        };

        // Add source_chunk_id if chunk-based, or memoryId in metadata if memory-based
        if (chunkId) {
            recallItemData.source_chunk_id = chunkId;
        } else if (memoryId) {
            recallItemData.metadata.memoryId = memoryId;
        }

        const { data: item, error: itemError } = await supabaseAdmin
            .from('recall_items')
            .insert(recallItemData)
            .select()
            .single();

        if (itemError) {
            console.error('Error creating recall item:', itemError);
            throw itemError;
        }

        // Initialize memory strength (SRS data)
        const { error: strengthError } = await supabaseAdmin
            .from('memory_strength')
            .insert({
                recall_item_id: item.id,
                strength: 0.0,
                interval_days: delay,
                ease_factor: 2.5,
                review_count: 0,
                last_review_at: new Date().toISOString(),
                next_review_at: nextReviewAt.toISOString()
            });

        if (strengthError) {
            console.error('Error creating memory strength:', strengthError);
            // Rollback recall item if strength creation fails
            await supabaseAdmin
                .from('recall_items')
                .delete()
                .eq('id', item.id);
            throw strengthError;
        }

        return NextResponse.json({
            success: true,
            item: {
                id: item.id,
                content: item.content,
                nextReviewAt: nextReviewAt.toISOString()
            }
        });

    } catch (error: any) {
        console.error('Create Recall Item error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
