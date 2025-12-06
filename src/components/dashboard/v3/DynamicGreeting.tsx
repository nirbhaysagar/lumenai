'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function DynamicGreeting() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    const staticGreetings = [
        "What will you learn today?",
        "What are you searching for?",
        "Ready to expand your knowledge?",
        "Let's connect some dots.",
        "Your second brain is ready."
    ];

    useEffect(() => {
        const fetchInsight = async () => {
            try {
                // 1. Try to get yesterday's activity
                // Mocking for now as we don't have a dedicated "daily summary" endpoint yet
                // In a real app, we'd call /api/insights/daily

                const hasRecentActivity = Math.random() > 0.5; // Randomly show activity vs generic

                if (hasRecentActivity) {
                    // Simulate fetching
                    await new Promise(r => setTimeout(r, 500));
                    const activities = [
                        "Yesterday you explored 'Neural Networks'.",
                        "You added 5 new memories this week.",
                        "Your knowledge graph grew by 12% recently."
                    ];
                    setText(activities[Math.floor(Math.random() * activities.length)]);
                } else {
                    setText(staticGreetings[Math.floor(Math.random() * staticGreetings.length)]);
                }
            } catch (e) {
                setText(staticGreetings[Math.floor(Math.random() * staticGreetings.length)]);
            } finally {
                setLoading(false);
            }
        };

        fetchInsight();
    }, []);

    return (
        <div className="flex justify-center mt-2">
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-5"
                    />
                ) : (
                    <motion.div
                        key="text"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium"
                    >
                        <Sparkles className="w-3 h-3 text-primary/70" />
                        {text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
