'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, X, Brain, Calendar, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'lumen-recall-guide-dismissed';

export function RecallInfoCard() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has dismissed this before
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="border-blue-500/30 bg-blue-500/5 relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Info className="w-4 h-4" />
                            How Active Recall Works
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Active Recall uses spaced repetition to help you remember important information longer.
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <Brain className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Mark for Recall</p>
                                    <p className="text-xs text-muted-foreground">
                                        Create flashcards from any memory with custom questions and notes
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Review Daily</p>
                                    <p className="text-xs text-muted-foreground">
                                        Come back when items are due and rate how well you remembered
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Build Streaks</p>
                                    <p className="text-xs text-muted-foreground">
                                        The system automatically schedules reviews at optimal intervals
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleDismiss}
                            size="sm"
                            className="w-full mt-2"
                        >
                            Got it!
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
