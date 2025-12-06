import { useState } from 'react';
import { ChatMessage, exportMessageAsJSON, exportMessageAsMarkdown } from './ExportUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, Save, FileJson, FileType, Edit2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { getSourceIcon, getSourceTypeName, getSourceTypeColor, formatSourceMetadata } from '@/lib/sourceUtils';

interface MessageBubbleProps {
    message: ChatMessage;
    contextId: string;
    onCitationClick: (source: any) => void;
    onSaveSummary: () => void;
    isStreaming?: boolean;
}

export function MessageBubble({ message, contextId, onCitationClick, onSaveSummary, isStreaming }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
            <div className={cn("flex max-w-[85%] md:max-w-[75%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                    {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                    {/* Message Content */}
                    <Card className={cn(
                        "p-4 shadow-sm",
                        isUser ? "bg-primary text-primary-foreground" : "bg-card"
                    )}>
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                            {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
                        </div>
                    </Card>

                    {/* Assistant Actions & Citations */}
                    {!isUser && !isStreaming && (
                        <div className="space-y-3">
                            {/* Citations */}
                            {message.sources && message.sources.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {message.sources.map((source: any, idx: number) => {
                                        const Icon = getSourceIcon(source.sourceType || source.metadata?.type || 'text');
                                        const sourceType = getSourceTypeName(source.sourceType || source.metadata?.type || 'text');
                                        const metadata = formatSourceMetadata(source);

                                        return (
                                            <button
                                                key={`${source.chunkId}-${idx}`}
                                                onClick={() => onCitationClick(source)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md bg-background hover:bg-accent transition-colors max-w-[240px]"
                                                title={`${sourceType}: ${source.title || source.metadata?.title || 'View source'}`}
                                            >
                                                <Icon className={cn("w-3.5 h-3.5 shrink-0", getSourceTypeColor(source.sourceType || 'text'))} />
                                                <span className="text-[10px] text-muted-foreground uppercase font-medium shrink-0">
                                                    {sourceType}
                                                </span>
                                                <span className="truncate font-medium flex-1">
                                                    {source.title || source.metadata?.title || 'Untitled'}
                                                </span>
                                                {metadata && (
                                                    <span className="text-muted-foreground text-[10px] shrink-0">
                                                        {metadata}
                                                    </span>
                                                )}
                                                {source.score && (
                                                    <span className="text-muted-foreground shrink-0">
                                                        ({(source.score * 100).toFixed(0)}%)
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={onSaveSummary}
                                >
                                    <Save className="w-3 h-3 mr-2" />
                                    Save Summary
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                                            <Download className="w-3 h-3 mr-2" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => exportMessageAsMarkdown(message, contextId)}>
                                            <FileType className="w-4 h-4 mr-2" />
                                            Markdown
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => exportMessageAsJSON(message, contextId)}>
                                            <FileJson className="w-4 h-4 mr-2" />
                                            JSON
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
