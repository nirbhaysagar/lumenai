'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Calendar, MoreVertical, Eye, Share2, Layers, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';

interface MemoryCardProps {
    memory: any;
    onClick: () => void;
}

export function MemoryCard({ memory, onClick }: MemoryCardProps) {
    const [topics, setTopics] = useState<string[]>([]);

    // Parse content if it's JSON (some summaries are stored as JSON)
    const content = typeof memory.content === 'string'
        ? (memory.content.startsWith('{') ? JSON.parse(memory.content).summary : memory.content)
        : memory.content?.summary || 'No content';

    // Fetch topics from chunks
    useEffect(() => {
        const fetchTopics = async () => {
            if (!memory.capture_id) return;

            try {
                const res = await fetch(`/api/chunks?captureId=${memory.capture_id}&limit=5`);
                const data = await res.json();

                // Aggregate unique topics from chunks
                const allTopics = new Set<string>();
                data.chunks?.forEach((chunk: any) => {
                    const chunkTopics = chunk.metadata?.topics;
                    if (Array.isArray(chunkTopics)) {
                        chunkTopics.slice(0, 3).forEach((topic: string) => allTopics.add(topic));
                    }
                });

                setTopics(Array.from(allTopics).slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch topics:', error);
            }
        };

        fetchTopics();
    }, [memory.capture_id]);

    return (
        <Card
            className="group hover:border-primary/50 transition-all cursor-pointer bg-card/50 hover:bg-card hover:shadow-md"
            onClick={onClick}
        >
            <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                            <Brain className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm leading-tight">
                                {memory.contexts?.name
                                    ? `Insight: ${memory.contexts.name}`
                                    : memory.captures?.title
                                        ? `Summary: ${memory.captures.title}`
                                        : 'Canonical Memory'}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>

                <div className="prose prose-sm dark:prose-invert line-clamp-4 text-xs text-muted-foreground leading-relaxed">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>

                {/* Tags Section */}
                {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {topics.map((topic, idx) => (
                            <Badge
                                key={idx}
                                variant="outline"
                                className="text-[10px] px-2 h-5 font-normal bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                            >
                                <Tag className="w-2.5 h-2.5 mr-1" />
                                {topic}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                            Confidence: High
                        </Badge>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Share2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Layers className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
