'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState } from 'react';
import { Search, Filter, SortAsc, Pin, Clock, FileText, Image as ImageIcon, Code, Link as LinkIcon, MoreVertical, Plus, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContextNavProps {
    contextId: string;
    chunks?: any[];
    onSelect?: (chunk: any) => void;
    onRefresh?: () => void;
}

export function ContextNav({ contextId, chunks = [], onSelect, onRefresh }: ContextNavProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const filters = [
        { id: 'pdf', label: 'PDFs', icon: FileText },
        { id: 'image', label: 'Images', icon: ImageIcon },
        { id: 'code', label: 'Code', icon: Code },
        { id: 'url', label: 'Links', icon: LinkIcon },
    ];

    // Filter chunks
    const filteredChunks = chunks.filter(chunk => {
        // Search filter
        if (search && !chunk.content?.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }

        // Type filter
        if (activeFilter) {
            const type = chunk.metadata?.type || 'text';
            if (activeFilter === 'pdf' && type !== 'pdf') return false;
            if (activeFilter === 'image' && type !== 'image') return false;
            if (activeFilter === 'code' && type !== 'code') return false;
            if (activeFilter === 'url' && type !== 'url') return false;
        }

        return true;
    });

    const uniqueChunks = filteredChunks.reduce((acc: any[], chunk) => {
        if (chunk.capture_id) {
            const exists = acc.find(c => c.capture_id === chunk.capture_id);
            if (!exists) {
                acc.push(chunk);
            }
        } else {
            acc.push(chunk);
        }
        return acc;
    }, []);

    const pinnedChunks = uniqueChunks.filter(chunk => chunk.pinned || chunk.captures?.pinned);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Uploading file...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('contextId', contextId);
        formData.append('userId', DEMO_USER_ID); // Hardcoded
        formData.append('type', file.type === 'application/pdf' ? 'pdf' : 'text'); // Simplified

        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            toast.success('File uploaded successfully', { id: toastId });
            onRefresh?.();
        } catch (error) {
            toast.error('Failed to upload file', { id: toastId });
        }
    };

    const handleTogglePin = async (e: React.MouseEvent, chunk: any) => {
        e.stopPropagation();
        const captureId = chunk.capture_id || chunk.id; // Fallback for direct captures
        const currentPinned = chunk.pinned || chunk.captures?.pinned || false;

        try {
            const res = await fetch('/api/captures', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: captureId, pinned: !currentPinned }),
            });

            if (res.ok) {
                toast.success(currentPinned ? 'Unpinned item' : 'Pinned item');
                onRefresh?.();
            } else {
                throw new Error('Failed to update pin');
            }
        } catch (error) {
            toast.error('Failed to update pin status');
        }
    };

    const renderItem = (chunk: any) => {
        const isPinned = chunk.pinned || chunk.captures?.pinned;
        return (
            <div
                key={chunk.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer group transition-colors relative"
                onClick={() => onSelect?.(chunk)}
            >
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    {chunk.metadata?.type === 'url' ? <LinkIcon className="w-4 h-4" /> :
                        chunk.metadata?.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                            <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground/90 pr-6">
                        {chunk.captures?.title || chunk.metadata?.title || chunk.content.slice(0, 30) || 'Untitled'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                        {new Date(chunk.created_at).toLocaleDateString()} • {chunk.metadata?.type || 'text'}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isPinned ? 'opacity-100 text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'}`}
                    onClick={(e) => handleTogglePin(e, chunk)}
                >
                    <Star className={`w-3 h-3 ${isPinned ? 'fill-yellow-500' : ''}`} />
                </Button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Top: Search & Filters */}
            <div className="p-4 space-y-4 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search context..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => document.getElementById('context-file-upload')?.click()}>
                                <FileText className="w-4 h-4 mr-2" /> Upload File
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open('/ingest', '_blank')}>
                                <LinkIcon className="w-4 h-4 mr-2" /> Full Ingest Portal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                        type="file"
                        id="context-file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.txt,.md"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <Button
                        variant={activeFilter === null ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs px-2.5 rounded-full"
                        onClick={() => setActiveFilter(null)}
                    >
                        All
                    </Button>
                    {filters.map(f => (
                        <Button
                            key={f.id}
                            variant={activeFilter === f.id ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs px-2.5 rounded-full gap-1.5"
                            onClick={() => setActiveFilter(f.id)}
                        >
                            <f.icon className="w-3 h-3" />
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Middle: Content List */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-6">
                    {/* Pinned Section */}
                    {pinnedChunks.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                                <Pin className="w-3 h-3" /> Pinned
                            </div>
                            <div className="space-y-1">
                                {pinnedChunks.map(renderItem)}
                            </div>
                        </div>
                    )}

                    {pinnedChunks.length > 0 && <Separator className="bg-border/40" />}

                    {/* Recent Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <Clock className="w-3 h-3" /> Recent
                            </div>
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                                <SortAsc className="w-3 h-3 text-muted-foreground" />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            {uniqueChunks.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    No items found in this context.
                                </div>
                            ) : (
                                uniqueChunks.map(renderItem)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
