import { FileText, Link as LinkIcon, Image as ImageIcon, MoreHorizontal, CornerDownRight, Copy, Eye, FileOutput } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemoryItemProps {
    chunk: any;
    onInsert: (text: string) => void;
    onClick: () => void;
}

export function MemoryItem({ chunk, onInsert, onClick }: MemoryItemProps) {
    const typeIcons = {
        pdf: FileText,
        url: LinkIcon,
        image: ImageIcon,
        text: FileText,
    };

    const Icon = typeIcons[chunk.source_type as keyof typeof typeIcons] || FileText;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(chunk.content);
    };

    return (
        <TooltipProvider>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
                                onClick={onClick}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                                            <Icon className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium truncate text-foreground/90">
                                            {chunk.metadata?.title || 'Untitled Memory'}
                                        </span>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onInsert(chunk.content); }}>
                                                <CornerDownRight className="w-3 h-3 mr-2" /> Insert into Chat
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                                                <Eye className="w-3 h-3 mr-2" /> View Details
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2 pl-8">
                                    {chunk.content}
                                </p>

                                <div className="flex items-center gap-2 pl-8">
                                    {chunk.metadata?.tags?.slice(0, 2).map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="text-[10px] px-1 h-4">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                            <p className="font-semibold mb-1">{chunk.metadata?.title || 'Untitled'}</p>
                            <p className="line-clamp-6">{chunk.content}</p>
                        </TooltipContent>
                    </Tooltip>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => onInsert(chunk.content)}>
                        <CornerDownRight className="w-4 h-4 mr-2" /> Insert into Chat
                    </ContextMenuItem>
                    <ContextMenuItem onClick={onClick}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => navigator.clipboard.writeText(chunk.content)}>
                        <Copy className="w-4 h-4 mr-2" /> Copy Content
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </TooltipProvider>
    );
}
