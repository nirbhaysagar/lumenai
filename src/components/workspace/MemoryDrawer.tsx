'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Link as LinkIcon, MessageSquare, Calendar, Tag, ArrowRight, Star, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface MemoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    chunk: any;
    onUseInChat: (text: string) => void;
    onSummarize: (chunk: any) => void;
    onExtractTasks: (chunk: any) => void;
}

export function MemoryDrawer({ isOpen, onClose, chunk, onUseInChat, onSummarize, onExtractTasks }: MemoryDrawerProps) {
    if (!chunk) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(chunk.content);
        toast.success('Copied to clipboard');
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="space-y-4 pb-4 border-b">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl font-semibold">
                                {chunk.metadata?.title || 'Untitled Memory'}
                            </SheetTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="capitalize">
                                    {chunk.layer || 'Raw'}
                                </Badge>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(chunk.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                    <div className="space-y-6">
                        {/* Content Preview */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Content</h4>
                            <div className="p-4 rounded-lg bg-muted/30 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                {chunk.content}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    {chunk.metadata?.type === 'url' ? <LinkIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    <span className="capitalize">{chunk.metadata?.type || 'Text'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                                <div className="text-sm truncate" title={chunk.metadata?.source || 'Unknown'}>
                                    {chunk.metadata?.source || 'Direct Input'}
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {chunk.tags && chunk.tags.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {chunk.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <SheetFooter className="pt-4 border-t flex-row gap-2 sm:justify-between">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onSummarize(chunk)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Summarize
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExtractTasks(chunk)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Extract Tasks
                        </Button>
                    </div>
                    <Button onClick={() => {
                        onUseInChat(chunk.content);
                        onClose();
                    }}>
                        Use in Chat
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
