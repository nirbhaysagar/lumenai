import { useState, useEffect } from 'react';
import { DEMO_USER_ID } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Layers, Plus, FileText, Upload, X } from 'lucide-react';
import { MemoryListItem } from './MemoryListItem';
import { MarkForRecallModal } from '@/components/recall/MarkForRecallModal';
import { MemoryDrawer } from './MemoryDrawer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KnowledgeBrowserProps {
    contextId: string;
    onUseInChat?: (text: string) => void;
}

export function KnowledgeBrowser({ contextId, onUseInChat = () => { } }: KnowledgeBrowserProps) {
    const [search, setSearch] = useState('');
    const [chunks, setChunks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Recall Modal State
    const [recallModalOpen, setRecallModalOpen] = useState(false);
    const [selectedChunkForRecall, setSelectedChunkForRecall] = useState<any>(null);

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedChunkForDrawer, setSelectedChunkForDrawer] = useState<any>(null);

    // Mock fetch for now - replace with real API
    useEffect(() => {
        const fetchChunks = async () => {
            setLoading(true);
            try {
                // In a real app, we'd pass search and filter params to the API
                const res = await fetch(`/api/contexts/${contextId}/chunks?search=${search}`);
                const data = await res.json();
                if (data.chunks) {
                    setChunks(data.chunks);
                }
            } catch (error) {
                console.error('Failed to fetch chunks', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchChunks();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [contextId, search]);

    const handleAddToRecall = (chunk: any) => {
        setSelectedChunkForRecall(chunk);
        setRecallModalOpen(true);
    };

    const handleOpenDrawer = (chunk: any) => {
        setSelectedChunkForDrawer(chunk);
        setDrawerOpen(true);
    };

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev =>
            prev.includes(filter)
                ? prev.filter(f => f !== filter)
                : [...prev, filter]
        );
    };

    const filters = [
        { id: 'pdf', label: 'PDF' },
        { id: 'url', label: 'URL' },
        { id: 'note', label: 'Notes' },
        { id: 'image', label: 'Images' },
    ];

    return (
        <div className="flex flex-col h-full bg-muted/10 border-r">
            {/* 2.1 Header */}
            <div className="p-4 space-y-4 border-b bg-background/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            Context Memories
                        </h2>
                        <p className="text-xs text-muted-foreground">{chunks.length} items</p>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 gap-1 text-xs text-muted-foreground"
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        >
                            <span className="font-mono text-[10px] bg-muted px-1 rounded border">⌘K</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                            <Upload className="w-3 h-3" />
                            Upload
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                            <FileText className="w-3 h-3" />
                            Note
                        </Button>
                    </div>
                </div>

                {/* 2.2 Search + Filters */}
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search memories..."
                            className="pl-9 bg-background h-9 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {filters.map(f => (
                            <Badge
                                key={f.id}
                                variant={activeFilters.includes(f.id) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/90 transition-colors"
                                onClick={() => toggleFilter(f.id)}
                            >
                                {f.label}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2.3 Memory List */}
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                            Loading...
                        </div>
                    ) : chunks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                            No memories found.
                        </div>
                    ) : (
                        chunks.map((chunk) => (
                            <MemoryListItem
                                key={chunk.id}
                                chunk={chunk}
                                onUseInChat={onUseInChat}
                                onAddToRecall={() => handleAddToRecall(chunk)}
                                onClick={() => handleOpenDrawer(chunk)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Recall Modal */}
            {selectedChunkForRecall && (
                <MarkForRecallModal
                    isOpen={recallModalOpen}
                    onClose={() => setRecallModalOpen(false)}
                    chunk={selectedChunkForRecall}
                    userId={DEMO_USER_ID} // Hardcoded
                />
            )}

            {/* Memory Drawer */}
            <MemoryDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                chunk={selectedChunkForDrawer}
                onUseInChat={onUseInChat}
            />
        </div>
    );
}
