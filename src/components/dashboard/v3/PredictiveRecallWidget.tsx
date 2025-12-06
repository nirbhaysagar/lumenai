import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, BrainCircuit, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Suggestion {
    id: string;
    content: string;
    created_at: string;
}

interface PredictiveRecallWidgetProps {
    userId: string;
}

export function PredictiveRecallWidget({ userId }: PredictiveRecallWidgetProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`/api/recall/suggestions?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchSuggestions();
        }
    }, [userId]);

    const handleAction = async (action: 'accept' | 'dismiss') => {
        const currentItem = suggestions[currentIndex];
        if (!currentItem) return;

        // Optimistic update
        const nextIndex = currentIndex + 1;

        try {
            await fetch('/api/recall/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: currentItem.id, action }),
            });

            if (action === 'accept') {
                toast.success('Added to your memory bank!');
            } else {
                toast.info('Suggestion dismissed');
            }

            setCurrentIndex(nextIndex);

        } catch (error) {
            toast.error('Failed to update suggestion');
        }
    };

    if (loading) {
        return (
            <Card className="w-full bg-muted/5 border-dashed">
                <div className="p-6 flex justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" />
                </div>
            </Card>
        );
    }

    if (suggestions.length === 0 || currentIndex >= suggestions.length) {
        return null; // Don't show anything if no suggestions
    }

    const currentItem = suggestions[currentIndex];

    return (
        <Card className="w-full relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-primary">
                    <BrainCircuit className="h-4 w-4" />
                    Predictive Recall
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentItem.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                Should I remind you of this?
                            </p>
                            <p className="text-sm font-medium leading-relaxed bg-background/50 p-3 rounded-lg border border-border/50">
                                "{currentItem.content}"
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-red-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors"
                                onClick={() => handleAction('dismiss')}
                            >
                                <X className="w-4 h-4 mr-1" />
                                No
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm"
                                onClick={() => handleAction('accept')}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Yes, Remind Me
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
