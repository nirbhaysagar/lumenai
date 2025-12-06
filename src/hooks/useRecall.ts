import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useRecall() {
    const supabase = createClientComponentClient();
    const queryClient = useQueryClient();

    // 1. Explicit Recall: "Remember this"
    const rememberMutation = useMutation({
        mutationFn: async ({ content, contextId }: { content: string; contextId?: string }) => {
            // Insert into recall_items
            const { data, error } = await supabase
                .from('recall_items')
                .insert({
                    content,
                    context_id: contextId,
                    recall_type: 'explicit',
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;

            // Trigger worker via API (optional, if we want immediate processing)
            // await fetch('/api/recall/process', { method: 'POST', body: JSON.stringify({ id: data.id }) });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recall_items'] });
        }
    });

    // 2. Predictive Recall: "Daily Refresher"
    const { data: refresherItems, isLoading: isLoadingRefresher } = useQuery({
        queryKey: ['recall_refresher'],
        queryFn: async () => {
            // Fetch items due for review from memory_strength joined with recall_items
            const { data, error } = await supabase
                .from('memory_strength')
                .select(`
                    recall_item_id,
                    strength,
                    next_review_at,
                    recall_items (
                        id,
                        content,
                        metadata,
                        source_chunk_id
                    )
                `)
                .lte('next_review_at', new Date().toISOString())
                .limit(5);

            if (error) throw error;
            return data;
        }
    });

    // 3. Mark as Reviewed (Spaced Repetition Update)
    const reviewMutation = useMutation({
        mutationFn: async ({ itemId, quality }: { itemId: string; quality: number }) => {
            // quality: 0 (forgot) to 5 (perfect)
            // Call API to update strength logic (complex logic better on server)
            const response = await fetch('/api/recall/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, quality })
            });
            if (!response.ok) throw new Error('Failed to submit review');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recall_refresher'] });
        }
    });

    return {
        remember: rememberMutation.mutateAsync,
        isRemembering: rememberMutation.isPending,
        refresherItems,
        isLoadingRefresher,
        submitReview: reviewMutation.mutateAsync
    };
}
