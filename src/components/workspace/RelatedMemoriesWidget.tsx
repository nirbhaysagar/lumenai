'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function RelatedMemoriesWidget({ contextId }: { contextId: string }) {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real implementation, this would fetch based on the current chat context or selected memory
        // For now, we'll fetch random memories as a placeholder for "related"
        const fetchRelated = async () => {
            try {
                const res = await fetch(`/api/agent/related?contextId=${contextId}&limit=3`);
                const data = await res.json();
                if (data.chunks) {
                    setMemories(data.chunks);
                }
            } catch (error) {
                console.error('Failed to fetch related memories', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [contextId]);

    const typeIcons = {
        pdf: FileText,
        url: LinkIcon,
        image: ImageIcon,
        text: FileText,
    };

    if (loading) return null;
    if (memories.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <FileText className="w-3 h-3" /> Related Memories
            </div>
            <div className="space-y-2">
                {memories.map((memory) => {
                    const Icon = typeIcons[memory.source_type as keyof typeof typeIcons] || FileText;
                    return (
                        <Card key={memory.id} className="bg-background/50 border-border/50 shadow-sm hover:border-primary/30 transition-colors cursor-pointer group">
                            <CardContent className="p-3">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 p-1 rounded-md bg-primary/10 text-primary shrink-0">
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground/90 truncate">
                                            {memory.metadata?.title || 'Untitled Memory'}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                            {memory.content}
                                        </p>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
