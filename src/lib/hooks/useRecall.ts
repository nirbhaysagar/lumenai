import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface RecallItem {
    id: string;
    content: string;
    metadata?: {
        note?: string;
        [key: string]: any;
    };
    chunk_id?: string;
    [key: string]: any;
}

interface UseRecallOptions {
    userId: string;
    enabled?: boolean;
}

export function useRecall({ userId, enabled = true }: UseRecallOptions) {
    const [items, setItems] = useState<RecallItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchDueItems = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/recall/review?userId=${userId}`);
            const data = await res.json();
            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch recall items', error);
            toast.error('Failed to load review deck');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (enabled) {
            fetchDueItems();
        }
    }, [enabled, fetchDueItems]);

    const submitReview = async (itemId: string, quality: number) => {
        if (!userId || !itemId) return false;
        setSubmitting(true);

        try {
            const res = await fetch('/api/recall/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    itemId, // Fixed: API expects 'itemId', not 'recallItemId'
                    quality
                })
            });

            if (res.ok) {
                // Optimistically remove the item from the list
                setItems(prev => prev.filter(item => item.id !== itemId));
                toast.success('Review saved');
                return true;
            } else {
                toast.error('Failed to save review');
                return false;
            }
        } catch (error) {
            toast.error('Error submitting review');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        items,
        loading,
        submitting,
        submitReview,
        refresh: fetchDueItems
    };
}
