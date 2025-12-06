'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Calendar, Share2, Layers, Edit2, Trash2, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MarkForRecallModal } from '@/components/recall/MarkForRecallModal';
import { DEMO_USER_ID } from '@/lib/constants';
import { useState, useEffect } from 'react';

interface MemoryDrawerProps {
    memory: any;
    isOpen: boolean;
    onClose: () => void;
}

export function MemoryDrawer({ memory, isOpen, onClose }: MemoryDrawerProps) {
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [topics, setTopics] = useState<string[]>([]);

    useEffect(() => {
        const fetchTopics = async () => {
            if (!memory?.capture_id) return;

            try {
                const res = await fetch(`/api/chunks?captureId=${memory.capture_id}&limit=10`);
                const data = await res.json();

                // Aggregate unique topics from chunks
                const allTopics = new Set<string>();
                data.chunks?.forEach((chunk: any) => {
                    const chunkTopics = chunk.metadata?.topics;
                    if (Array.isArray(chunkTopics)) {
                        chunkTopics.forEach((topic: string) => allTopics.add(topic));
                    }
                });

                setTopics(Array.from(allTopics));
            } catch (error) {
                console.error('Failed to fetch topics:', error);
            }
        };

        if (isOpen) {
            fetchTopics();
        }
    }, [memory?.capture_id, isOpen]);

    if (!memory) return null;

    const content = typeof memory.content === 'string'
        ? (memory.content.startsWith('{') ? JSON.parse(memory.content) : { summary: memory.content })
        : memory.content;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col gap-0 p-0">
                <SheetHeader className="p-6 border-b border-border/40 bg-muted/5 flex-shrink-0">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
                            <Brain className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <SheetTitle className="text-lg font-semibold leading-tight">
                                {memory.contexts?.name ? `Insight: ${memory.contexts.name}` : 'Canonical Memory'}
                            </SheetTitle>
                            <SheetDescription className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-blue-500/20 text-blue-500">
                                    Canonical
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(memory.created_at), 'PPP p')}
                                </span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>


                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Main Content */}
                        <div className="space-y-4">
                            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                <ReactMarkdown>{content.summary}</ReactMarkdown>
                            </div>

                            {content.takeaways && (
                                <div className="space-y-2 pt-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Takeaways</h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {content.takeaways.map((t: string, i: number) => (
                                            <li key={i}>{t}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {content.actions && (
                                <div className="space-y-2 pt-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action Items</h4>
                                    <ul className="space-y-2">
                                        {content.actions.map((a: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Topics Section */}
                        {topics.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-border/40">
                                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    Topics
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {topics.map((topic, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="outline"
                                            className="text-xs px-3 h-6 font-normal bg-primary/5 border-primary/20 text-primary"
                                        >
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Provenance (Placeholder) */}
                        <div className="space-y-3 pt-4 border-t border-border/40">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Provenance</h3>
                            <div className="p-3 rounded-lg border border-border/50 bg-muted/20 text-xs text-muted-foreground">
                                Generated from context analysis of <strong>{memory.contexts?.name}</strong>.
                            </div>
                        </div>
                    </div>
                </div>


                <SheetFooter className="p-6 border-t border-border/40 bg-muted/5 flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsRecallModalOpen(true)}
                    >
                        <Brain className="w-4 h-4 mr-2" />
                        Add to Daily Recall
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            const textToCopy = `> ${content.summary}\n\n[Memory ID: ${memory.id}]`;
                            navigator.clipboard.writeText(textToCopy);
                            toast.success('Copied to clipboard', { description: 'Paste it into the chat.' });
                        }}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Insert into Chat
                    </Button>
                    <Button variant="destructive" size="icon">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </SheetFooter>
            </SheetContent>

            <MarkForRecallModal
                isOpen={isRecallModalOpen}
                onClose={() => setIsRecallModalOpen(false)}
                chunk={null}
                memory={memory}
                userId={DEMO_USER_ID}
            />
        </Sheet>
    );
}
