'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { DEMO_USER_ID } from '@/lib/constants';

export function ImplicitMemoryWidget() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userId = DEMO_USER_ID;

    useEffect(() => {
        fetchImplicitItems();
    }, []);

    const fetchImplicitItems = async () => {
        try {
            const res = await fetch(`/api/recall/review?userId=${userId}&mode=implicit`);
            const data = await res.json();
            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch implicit items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'dismiss' | 'boost') => {
        if (!items[0]) return;
        const currentItem = items[0];

        // Optimistic update
        const newItems = items.slice(1);
        setItems(newItems);

        if (action === 'boost') {
            toast.success('Memory boosted!');
            try {
                await fetch('/api/recall/review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: currentItem.id,
                        quality: 4 // Good recall
                    })
                });
            } catch (error) {
                console.error('Boost failed', error);
                toast.error('Failed to boost memory');
            }
        }

        if (newItems.length === 0) {
            // Optionally fetch more, but for now let's just show empty state
            // fetchImplicitItems();
        }
    };

    if (loading) return <div className="h-[200px] bg-muted/20 animate-pulse rounded-xl" />;

    if (items.length === 0) {
        return (
            <Card className="h-full bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
                <CardContent className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold text-indigo-500">No Hidden Gems</h3>
                    <p className="text-xs text-muted-foreground mt-1">Your memory surface is clear.</p>
                </CardContent>
            </Card>
        );
    }

    const currentItem = items[0];

    return (
        <Card className="h-full flex flex-col overflow-hidden relative border-indigo-500/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    Resurfaced Memory
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 pt-0">
                <div className="flex-1 flex items-center justify-center text-center py-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentItem.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-4"
                        >
                            <p className="text-lg font-medium leading-snug text-foreground/90">
                                {currentItem.content}
                            </p>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => handleAction('dismiss')}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Dismiss
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950"
                                    onClick={() => handleAction('boost')}
                                >
                                    <ThumbsUp className="w-4 h-4 mr-1" />
                                    Boost
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
