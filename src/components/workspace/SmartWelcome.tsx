'use client';

import { useEffect, useState } from 'react';
import { Sparkles, FileText, ArrowRight, Brain, ListTodo, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMemories } from '@/lib/hooks/useMemories';
import { formatDistanceToNow } from 'date-fns';

interface SmartWelcomeProps {
    userId: string;
    contextId: string;
    onAction: (action: string, payload?: any) => void;
}

export function SmartWelcome({ userId, contextId, onAction }: SmartWelcomeProps) {
    const { memories } = useMemories(contextId);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    const recentMemories = memories.slice(0, 3);

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-2 mb-12">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Brain className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {greeting}, User
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Your workspace is ready. Here's what's happening.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Recent Memories */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Recent Memories
                    </h3>
                    <div className="space-y-3">
                        {recentMemories.length > 0 ? (
                            recentMemories.map((memory) => (
                                <Card
                                    key={memory.id}
                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group border-border/50"
                                    onClick={() => onAction('view_memory', memory)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                    {memory.metadata?.title || 'Untitled Memory'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                                No recent memories found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Suggested Actions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Suggested Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start text-left hover:border-primary/50 hover:bg-primary/5 group border-border/50"
                            onClick={() => onAction('summarize_workspace')}
                        >
                            <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 mr-4 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium">Summarize Workspace</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Get a high-level overview of all recent content
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start text-left hover:border-primary/50 hover:bg-primary/5 group border-border/50"
                            onClick={() => onAction('plan_day')}
                        >
                            <div className="p-2 rounded-md bg-green-500/10 text-green-500 mr-4 group-hover:scale-110 transition-transform">
                                <ListTodo className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium">Plan My Day</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Extract tasks and prioritize your schedule
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start text-left hover:border-primary/50 hover:bg-primary/5 group border-border/50"
                            onClick={() => onAction('find_themes')}
                        >
                            <div className="p-2 rounded-md bg-amber-500/10 text-amber-500 mr-4 group-hover:scale-110 transition-transform">
                                <Brain className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium">Find Key Themes</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Discover connecting concepts in your knowledge base
                                </div>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
