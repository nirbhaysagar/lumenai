'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { FileText, Link as LinkIcon, Image as ImageIcon, FileAudio, Twitter, MoreVertical, Eye, Pin, FolderInput, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CaptureCardProps {
    capture: any;
    selected?: boolean;
    onSelect?: (selected: boolean) => void;
    onClick: () => void;
    onAction: (action: string, capture: any) => void;
}

export function CaptureCard({ capture, selected, onSelect, onClick, onAction }: CaptureCardProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
            case 'url': return <LinkIcon className="w-5 h-5 text-blue-500" />;
            case 'image': return <ImageIcon className="w-5 h-5 text-purple-500" />;
            case 'audio': return <FileAudio className="w-5 h-5 text-yellow-500" />;
            case 'tweet': return <Twitter className="w-5 h-5 text-sky-500" />;
            default: return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <Card
            className={cn(
                "group hover:border-primary/50 transition-all cursor-pointer bg-card/50 hover:bg-card hover:shadow-md relative",
                selected && "border-primary bg-primary/5"
            )}
            onClick={onClick}
        >
            {/* Selection Checkbox */}
            {onSelect && (
                <div
                    className={cn(
                        "absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                        selected && "opacity-100"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(!selected);
                    }}
                >
                    <div className={cn(
                        "w-5 h-5 rounded border border-muted-foreground/40 bg-background flex items-center justify-center transition-colors",
                        selected && "bg-primary border-primary text-primary-foreground"
                    )}>
                        {selected && <div className="w-2.5 h-2.5 bg-current rounded-sm" />}
                    </div>
                </div>
            )}

            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="p-2 rounded-lg bg-background border border-border/50 shrink-0">
                        {getIcon(capture.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-medium text-sm truncate leading-tight mb-1" title={capture.title}>
                            {capture.title || 'Untitled Capture'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(capture.created_at), { addSuffix: true })}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('delete', capture); }} className="text-red-500 focus:text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Excerpt (if available) */}
                {capture.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {capture.summary}
                    </p>
                )}

                <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-normal capitalize border", getStatusColor(capture.status))}>
                        {capture.status}
                    </Badge>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                            <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-6 w-6", capture.pinned && "text-primary")}
                            onClick={(e) => { e.stopPropagation(); onAction('pin', capture); }}
                        >
                            <Pin className={cn("w-3 h-3", capture.pinned && "fill-current")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onAction('assign', capture); }}>
                            <FolderInput className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
