import React, { useState } from 'react';
import { useRecall } from '@/hooks/useRecall';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RecallWidget() {
    const { refresherItems, isLoadingRefresher, submitReview } = useRecall();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    if (isLoadingRefresher) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!refresherItems || refresherItems.length === 0) {
        return (
            <Card className="w-full bg-muted/20 border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Check className="mx-auto mb-2 h-6 w-6" />
                    <p>All caught up! No memories to review today.</p>
                </CardContent>
            </Card>
        );
    }

    if (currentIndex >= refresherItems.length) {
        return (
            <Card className="w-full bg-green-50/10 border-green-500/20">
                <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-green-500 mb-2">Session Complete!</h3>
                    <p className="text-muted-foreground">You've reviewed all items for today.</p>
                </CardContent>
            </Card>
        );
    }

    const currentItem = refresherItems[currentIndex] as any;

    // Parse content if it's JSON
    let question = currentItem.content;
    let answer = '';
    let context = '';

    try {
        if (currentItem.content.startsWith('{')) {
            const parsed = JSON.parse(currentItem.content);
            question = parsed.question || currentItem.content;
            answer = parsed.answer || '';
            context = parsed.original_text || '';
        }
    } catch (e) {
        // Legacy content (plain string)
    }

    const handleReview = async (quality: number) => {
        await submitReview({ itemId: currentItem.recall_item_id, quality });
        setShowAnswer(false);
        setCurrentIndex(prev => prev + 1);
    };

    return (
        <Card className="w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentIndex) / refresherItems.length) * 100}%` }}
                />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    Daily Refresher ({currentIndex + 1}/{refresherItems.length})
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center text-center p-6 relative">
                <AnimatePresence mode="wait">
                    {!showAnswer ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-medium leading-relaxed">
                                {question}
                            </h3>
                            <Button variant="secondary" size="sm" onClick={() => setShowAnswer(true)}>
                                Show Answer
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="answer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-primary uppercase tracking-wider">Answer</div>
                                <p className="text-base">{answer || 'No answer generated.'}</p>
                            </div>

                            {context && (
                                <div className="pt-4 border-t border-white/10">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Context</div>
                                    <p className="text-xs text-muted-foreground line-clamp-3 italic">
                                        "{context}"
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-4 gap-2">
                                <Button variant="outline" className="border-red-500/50 hover:bg-red-500/10" onClick={() => handleReview(0)}>
                                    Forgot
                                </Button>
                                <Button variant="outline" className="border-orange-500/50 hover:bg-orange-500/10" onClick={() => handleReview(3)}>
                                    Hard
                                </Button>
                                <Button variant="outline" className="border-blue-500/50 hover:bg-blue-500/10" onClick={() => handleReview(4)}>
                                    Good
                                </Button>
                                <Button variant="outline" className="border-green-500/50 hover:bg-green-500/10" onClick={() => handleReview(5)}>
                                    Perfect
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
