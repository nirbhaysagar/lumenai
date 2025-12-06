'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Check, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function MiniRecallWidget() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [done, setDone] = useState(false);

    // Hardcoded userId
    const userId = DEMO_USER_ID;

    useEffect(() => {
        fetchDueItems();
    }, []);

    const fetchDueItems = async () => {
        try {
            const res = await fetch(`/api/recall/review?userId=${userId}`);
            const data = await res.json();
            if (data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch recall items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (quality: number) => {
        if (!items[0]) return;

        try {
            await fetch('/api/recall/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    recallItemId: items[0].id,
                    quality
                })
            });

            // Remove item locally
            const newItems = items.slice(1);
            setItems(newItems);
            setRevealed(false);

            if (newItems.length === 0) {
                setDone(true);
            }
        } catch (error) {
            console.error('Review failed', error);
        }
    };

    if (loading) return <div className="h-[200px] bg-muted/20 animate-pulse rounded-xl" />;

    if (done || items.length === 0) {
        return (
            <Card className="h-full bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                <CardContent className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-emerald-500">All Caught Up!</h3>
                    <p className="text-xs text-muted-foreground mt-1">Memory reinforcement complete for now.</p>
                </CardContent>
            </Card>
        );
    }

    const currentItem = items[0];

    return (
        <Card className="h-full flex flex-col overflow-hidden relative">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Daily Refresher
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground">{items.length} due</span>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 pt-0">
                <div className="flex-1 flex items-center justify-center text-center py-4">
                    <AnimatePresence mode="wait">
                        {!revealed ? (
                            <motion.div
                                key="question"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <p className="text-lg font-medium leading-snug">{currentItem.content}</p>
                                <Button size="sm" onClick={() => setRevealed(true)}>Reveal Answer</Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="answer"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 w-full"
                            >
                                <p className="text-sm text-muted-foreground">{currentItem.metadata?.note || "No context."}</p>
                                <div className="grid grid-cols-3 gap-2 w-full">
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReview(1)}>Again</Button>
                                    <Button variant="outline" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleReview(4)}>Good</Button>
                                    <Button variant="outline" size="sm" className="text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => handleReview(5)}>Easy</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
