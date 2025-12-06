'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, MessageSquare, Plus, Star, Eye, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MemoryListItemProps {
    chunk: any;
    onUseInChat: (text: string) => void;
    onAddToRecall?: () => void;
    onClick?: () => void;
}

export function MemoryListItem({ chunk, onUseInChat, onAddToRecall, onClick }: MemoryListItemProps) {
    const layerColor: Record<string, string> = {
        raw: 'text-slate-500',
        canonical: 'text-blue-500',
        abstract: 'text-purple-500',
    };
    const colorClass = layerColor[chunk.layer || 'raw'] || 'text-slate-500';

    const typeIcons: Record<string, React.ReactNode> = {
        pdf: <FileText className="w-4 h-4 text-red-500" />,
        url: <LinkIcon className="w-4 h-4 text-blue-400" />,
        text: <MessageSquare className="w-4 h-4 text-slate-400" />,
        image: <ImageIcon className="w-4 h-4 text-purple-400" />,
    };
    const icon = typeIcons[chunk.metadata?.type || 'text'] || <FileText className="w-4 h-4 text-slate-400" />;

    return (
        <div
            className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border/50"
            onClick={onClick}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate text-foreground">
                        {chunk.metadata?.title || 'Untitled Memory'}
                    </span>
                    {chunk.similarity && (
                        <Badge variant="outline" className="text-[10px] px-1 h-4 border-green-500/30 text-green-600 dark:text-green-400">
                            {Math.round(chunk.similarity * 100)}%
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("capitalize font-medium", colorClass)}>
                        {chunk.layer || 'Raw'}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">
                        {chunk.content.substring(0, 30)}...
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(chunk.created_at), { addSuffix: true })}</span>
                </div>
            </div>

            {/* Actions (Hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Use in Chat"
                    onClick={(e) => {
                        e.stopPropagation();
                        onUseInChat(chunk.content);
                    }}
                >
                    <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="More"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Open menu
                    }}
                >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
