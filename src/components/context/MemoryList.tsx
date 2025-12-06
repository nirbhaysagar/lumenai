'use client';

import { useState, useEffect, useRef } from 'react';
import { ChunkCard } from './ChunkCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/lib/hooks/useDebounce'; // We might need to create this or use simple timeout
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemoryListProps {
    contextId: string;
    onUseInChat: (text: string) => void;
}

const FILTER_TYPES = ['pdf', 'url', 'image', 'text', 'audio', 'video', 'document'];

export function MemoryList({ contextId, onUseInChat }: MemoryListProps) {
    const [chunks, setChunks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    // Simple debounce for search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchChunks(true);
    }, [contextId, debouncedSearch, selectedTypes]);

    const fetchChunks = async (reset = false) => {
        if (reset) {
            setLoading(true);
            setCursor(null);
        }

        try {
            const params = new URLSearchParams({
                limit: '20',
                query: debouncedSearch,
            });

            if (selectedTypes.length > 0) {
                params.append('types', selectedTypes.join(','));
            }

            if (!reset && cursor) {
                params.append('cursor', cursor);
            }

            const res = await fetch(`/api/contexts/${contextId}/chunks?${params}`);
            const data = await res.json();

            if (data.chunks) {
                setChunks(prev => reset ? data.chunks : [...prev, ...data.chunks]);
                setCursor(data.nextCursor);
                setHasMore(!!data.nextCursor);
            }
        } catch (error) {
            console.error('Failed to fetch chunks', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    return (
        <div className="flex flex-col h-full bg-muted/10 border-r">
            {/* Header / Search */}
            <div className="p-3 border-b space-y-3 bg-background/50 backdrop-blur">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search memories..."
                        className="pl-9 bg-background h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <Filter className="w-3 h-3" />
                                Filter
                                {selectedTypes.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{selectedTypes.length}</Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {FILTER_TYPES.map(type => (
                                <DropdownMenuCheckboxItem
                                    key={type}
                                    checked={selectedTypes.includes(type)}
                                    onCheckedChange={() => toggleType(type)}
                                    className="capitalize"
                                >
                                    {type}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {selectedTypes.map(type => (
                        <Badge key={type} variant="secondary" className="h-7 text-xs capitalize gap-1 pl-2 pr-1">
                            {type}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 hover:bg-transparent"
                                onClick={() => toggleType(type)}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </Badge>
                    ))}
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {loading && chunks.length === 0 ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : chunks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No memories found.
                        </div>
                    ) : (
                        <>
                            {chunks.map((chunk) => (
                                <ChunkCard
                                    key={chunk.id}
                                    chunk={chunk}
                                    onUseInChat={onUseInChat}
                                    onViewDetail={(c) => console.log('View', c)}
                                />
                            ))}

                            {hasMore && (
                                <div className="pt-2 pb-4 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => fetchChunks(false)}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
