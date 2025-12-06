import { useState } from 'react';
import { DEMO_USER_ID } from '@/lib/constants';
import { Search, Filter, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MemoryItem } from './MemoryItem';
import { useMemories } from '@/lib/hooks/useMemories';
import { Badge } from '@/components/ui/badge';
import { MemoryDrawer } from './MemoryDrawer';
import { toast } from 'sonner';

interface MemoryNavigatorProps {
    contextId: string;
    onInsert: (text: string) => void;
    selectedChunk: any;
    onSelectChunk: (chunk: any) => void;
}

export function MemoryNavigator({ contextId, onInsert, selectedChunk, onSelectChunk }: MemoryNavigatorProps) {
    const { memories, loading, searchQuery, setSearchQuery, filters, toggleFilter } = useMemories(contextId);

    const filterOptions = ['pdf', 'url', 'text'];

    const handleSummarize = async (chunk: any) => {
        try {
            toast.info('Starting summarization...');
            await fetch('/api/agent/summarize', {
                method: 'POST',
                body: JSON.stringify({
                    userId: DEMO_USER_ID, // TODO: Use actual user ID
                    chunkIds: [chunk.id],
                    type: 'brief'
                })
            });
            toast.success('Summarization queued');
        } catch (e) {
            toast.error('Failed to start summarization');
        }
    };

    const handleExtractTasks = async (chunk: any) => {
        try {
            toast.info('Extracting tasks...');
            await fetch('/api/agent/extract-tasks', {
                method: 'POST',
                body: JSON.stringify({
                    userId: DEMO_USER_ID, // TODO: Use actual user ID
                    chunkIds: [chunk.id]
                })
            });
            toast.success('Task extraction queued');
        } catch (e) {
            toast.error('Failed to start task extraction');
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-muted/5 border-r border-border/40 overflow-hidden">
                {/* Header */}
                <div className="p-4 space-y-4 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                            <Layers className="w-4 h-4 text-primary" />
                            Memory Bank
                        </h2>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {memories.length}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search memories..."
                                className="pl-9 h-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {filterOptions.map(f => (
                                <Badge
                                    key={f}
                                    variant={filters.includes(f) ? "default" : "outline"}
                                    className="cursor-pointer text-[10px] px-2 h-6 capitalize"
                                    onClick={() => toggleFilter(f)}
                                >
                                    {f}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List */}
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-xs">Syncing memories...</span>
                            </div>
                        ) : memories.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-xs">
                                No memories found matching your criteria.
                            </div>
                        ) : (
                            // Group memories by type if no search query
                            searchQuery ? (
                                memories.map((chunk) => (
                                    <MemoryItem
                                        key={chunk.id}
                                        chunk={chunk}
                                        onInsert={onInsert}
                                        onClick={() => onSelectChunk(chunk)}
                                    />
                                ))
                            ) : (
                                ['pdf', 'url', 'text', 'image'].map(type => {
                                    const typeMemories = memories.filter(m => (m.source_type || 'text') === type);
                                    if (typeMemories.length === 0) return null;
                                    return (
                                        <div key={type} className="space-y-2">
                                            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                                                {type === 'url' ? 'Web Pages' : type === 'pdf' ? 'Documents' : type === 'image' ? 'Images' : 'Notes'}
                                            </h3>
                                            <div className="space-y-1">
                                                {typeMemories.map(chunk => (
                                                    <MemoryItem
                                                        key={chunk.id}
                                                        chunk={chunk}
                                                        onInsert={onInsert}
                                                        onClick={() => onSelectChunk(chunk)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>

            <MemoryDrawer
                isOpen={!!selectedChunk}
                onClose={() => onSelectChunk(null)}
                chunk={selectedChunk}
                onUseInChat={onInsert}
                onSummarize={handleSummarize}
                onExtractTasks={handleExtractTasks}
            />
        </>
    );
}
