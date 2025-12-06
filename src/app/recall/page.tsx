'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Brain, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RecallInfoCard } from '@/components/recall/RecallInfoCard';
import { useRecall } from '@/lib/hooks/useRecall';

export default function RecallPage() {
    // Hardcoded for now
    const userId = DEMO_USER_ID;

    const { items, loading, submitting, submitReview } = useRecall({ userId });
    const [isRevealed, setIsRevealed] = useState(false);

    // Track progress
    const [completedCount, setCompletedCount] = useState(0);
    const totalCountRef = useRef(0);

    // Update total count when items are first loaded
    useEffect(() => {
        if (items.length > 0 && totalCountRef.current === 0) {
            totalCountRef.current = items.length;
        }
    }, [items]);

    // If we have items but total is 0 (initial load), set it
    // Note: This logic handles the case where we start with N items. 
    // As items are removed, items.length decreases, but totalCountRef stays constant.
    // However, if we re-fetch, this might be tricky. For this simple version, it's fine.

    const handleReview = async (quality: number) => {
        if (items.length === 0 || submitting) return;

        const currentItem = items[0];
        const success = await submitReview(currentItem.id, quality);

        if (success) {
            setIsRevealed(false);
            setCompletedCount(prev => prev + 1);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (loading || items.length === 0) return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (!isRevealed) setIsRevealed(true);
            } else if (isRevealed && !submitting) {
                if (e.key === '1') handleReview(1);
                if (e.key === '2') handleReview(3); // Map 2 to Hard
                if (e.key === '3') handleReview(4); // Map 3 to Good
                if (e.key === '4') handleReview(5); // Map 4 to Easy
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRevealed, loading, items, submitting]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black/90">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-8 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-md w-full"
                >
                    <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                        <Check className="w-12 h-12 text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">All Caught Up!</h1>
                        <p className="text-muted-foreground">
                            Neural pathways reinforced. Great job keeping your memory sharp.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link href="/">
                            <Button className="w-full bg-primary hover:bg-primary/90">Return to Command Center</Button>
                        </Link>
                        <Link href="/contexts">
                            <Button variant="ghost" className="w-full">Go to Workspaces</Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentItem = items[0];
    const totalItems = Math.max(totalCountRef.current, items.length + completedCount);
    const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4 overflow-hidden relative">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/grid.svg')] opacity-[0.02]" />

            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-8 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold">Active Recall</h1>
                        <p className="text-xs text-muted-foreground">Daily Refresher</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-muted-foreground">
                        {completedCount + 1} / {totalItems}
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due Today
                    </Badge>
                </div>
            </div>

            {/* Info Card */}
            <div className="w-full max-w-2xl mb-6 z-10">
                <RecallInfoCard />
            </div>

            {/* Card Area */}
            <div className="relative w-full max-w-2xl aspect-[3/2] perspective-1000">
                <motion.div
                    key={currentItem.id} // Add key to force re-render animation on change
                    className="w-full h-full relative preserve-3d transition-all duration-500"
                    animate={{ rotateY: isRevealed ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden">
                        <div className="w-full h-full rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 flex flex-col items-center justify-center text-center shadow-2xl hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setIsRevealed(true)}>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Question</span>
                            <h2 className="text-2xl md:text-3xl font-medium leading-relaxed max-w-lg">
                                {currentItem.content}
                            </h2>
                            <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
                                <span className="px-2 py-1 rounded bg-white/5 border border-white/5">Space to reveal</span>
                            </div>
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180" style={{ transform: 'rotateY(180deg)' }}>
                        <div className="w-full h-full rounded-3xl bg-black/80 backdrop-blur-xl border border-primary/20 p-8 flex flex-col shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />

                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <span className="text-xs uppercase tracking-widest text-primary mb-4">Answer / Context</span>
                                <p className="text-lg text-foreground/90 leading-relaxed max-w-lg">
                                    {currentItem.metadata?.note || "No additional context provided."}
                                </p>
                                {currentItem.chunk_id && (
                                    <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-muted-foreground font-mono">
                                        Source: {currentItem.chunk_id.slice(0, 8)}...
                                    </div>
                                )}
                            </div>

                            {/* Rating Buttons */}
                            <div className="grid grid-cols-4 gap-3 mt-6">
                                <RatingButton label="Forgot" sub="1" color="red" onClick={() => handleReview(1)} disabled={submitting} />
                                <RatingButton label="Hard" sub="2" color="orange" onClick={() => handleReview(3)} disabled={submitting} />
                                <RatingButton label="Good" sub="3" color="blue" onClick={() => handleReview(4)} disabled={submitting} />
                                <RatingButton label="Easy" sub="4" color="emerald" onClick={() => handleReview(5)} disabled={submitting} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl mt-8 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function RatingButton({ label, sub, color, onClick, disabled }: any) {
    const colors: any = {
        red: 'border-red-500/20 hover:bg-red-500/10 text-red-500',
        orange: 'border-orange-500/20 hover:bg-orange-500/10 text-orange-500',
        blue: 'border-blue-500/20 hover:bg-blue-500/10 text-blue-500',
        emerald: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-black/20 transition-all active:scale-95 ${colors[color]} disabled:opacity-50`}
        >
            <span className="font-bold text-sm">{label}</span>
            <span className="text-[10px] opacity-60 font-mono">Key: {sub}</span>
        </button>
    );
}
