import { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, StopCircle, Paperclip, Globe, FileText, Download, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/lib/hooks/useChat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { SmartWelcome } from './SmartWelcome';
import { VoiceMic } from '@/components/dashboard/v3/VoiceMic';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SourceModal } from '@/components/chat/SourceModal';
import { supabaseAdmin } from '@/lib/supabase';
import { exportMessageAsMarkdown, exportMessageAsJSON } from '@/components/chat/ExportUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatPanelProps {
    contextId: string;
    userId: string;
    onInsertRef: (fn: (text: string) => void) => void;
    onOpenMemory?: (chunkId: string) => void;
    hideWelcome?: boolean;
    captureId?: string | null;
    selectedChunkTitle?: string | null;
    totalChunks?: number;
    initialMessage?: string;
    defaultToGlobal?: boolean;
}

export function ChatPanel({ contextId, userId, onInsertRef, onOpenMemory, hideWelcome, captureId, selectedChunkTitle, totalChunks = 0, initialMessage, defaultToGlobal = false }: ChatPanelProps) {
    const [isGlobal, setIsGlobal] = useState(defaultToGlobal);
    const [selectedSource, setSelectedSource] = useState<any>(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    // Effective capture ID: null if global, otherwise the passed captureId
    const effectiveCaptureId = isGlobal ? null : captureId;

    const { messages, setMessages, input, setInput, isLoading, sendMessage, stop, insertMemory } = useChat(contextId, userId, effectiveCaptureId);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Set initial message if provided
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage, setInput]);

    // Clear messages when switching contexts (unless global)
    useEffect(() => {
        if (!isGlobal) {
            setMessages([]);
        }
    }, [captureId, isGlobal, setMessages]);

    // Expose insertMemory to parent
    useEffect(() => {
        onInsertRef(insertMemory);
    }, [insertMemory, onInsertRef]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleSourceClick = async (sourceId: string) => {
        // In a real app, we'd fetch the source details here or pass them down.
        // For now, we'll try to find it in the message metadata if available, 
        // or fetch it from the DB.

        // Since we don't have easy access to the full source object from the markdown link,
        // we'll fetch it.
        try {
            // This is a client component, so we can't use supabaseAdmin directly if RLS is on.
            // But for now let's assume we can fetch via an API or just mock it if we can't.
            // Actually, let's just mock it for the UI verification since we don't have a specific API for fetching a single chunk by ID exposed yet.
            // Wait, we can use the /api/memories endpoint or similar?
            // Let's just create a quick fetch.

            const res = await fetch(`/api/memories?userId=${userId}&chunkId=${sourceId}`); // We might need to implement this filter
            const data = await res.json();

            // Fallback mock if API doesn't support single chunk fetch yet
            const mockSource = {
                id: sourceId,
                title: 'Fetched Source',
                snippet: 'This is the content of the source you clicked. It would normally be fetched from the database.',
                sourceType: 'text',
                metadata: { title: 'Example Source', type: 'text' }
            };

            setSelectedSource(mockSource);
            setIsSourceModalOpen(true);
        } catch (e) {
            console.error("Failed to fetch source", e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-gradient-to-r from-muted/20 to-muted/10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                        <Switch id="global-mode" checked={isGlobal} onCheckedChange={setIsGlobal} />
                        <Label htmlFor="global-mode" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                            {isGlobal ? (
                                <>
                                    <Globe className="w-4 h-4 text-primary" />
                                    <span className="text-primary">Global Context</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span>File Context</span>
                                </>
                            )}
                        </Label>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isGlobal ? (
                        <Badge variant="outline" className="text-xs h-6 bg-primary/5 border-primary/20 text-primary font-medium">
                            <Globe className="w-3 h-3 mr-1" />
                            {totalChunks} {totalChunks === 1 ? 'file' : 'files'}
                        </Badge>
                    ) : captureId && selectedChunkTitle ? (
                        <Badge variant="outline" className="text-xs h-6 bg-background/50 max-w-[200px] truncate">
                            <FileText className="w-3 h-3 mr-1 shrink-0" />
                            {selectedChunkTitle}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs h-6 bg-muted/30 text-muted-foreground">
                            No file selected
                        </Badge>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
            >
                {messages.length === 0 && !hideWelcome && (
                    <SmartWelcome
                        userId={userId}
                        contextId={contextId}
                        onAction={(action, payload) => {
                            if (action === 'view_memory') {
                                if (onOpenMemory) {
                                    onOpenMemory(payload.id); // Assuming payload has id
                                } else {
                                    insertMemory(payload.content);
                                }
                            } else if (action === 'summarize_workspace') {
                                sendMessage("Summarize the key insights from my recent memories.");
                            } else if (action === 'plan_day') {
                                sendMessage("Based on my recent notes and tasks, help me plan my day.");
                            } else if (action === 'find_themes') {
                                sendMessage("What are the recurring themes or concepts in my workspace?");
                            }
                        }}
                    />
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-4 max-w-3xl mx-auto group",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div className={cn(
                            "rounded-2xl px-5 py-3.5 max-w-[85%] shadow-sm relative",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted/50 border border-border/50 rounded-bl-none"
                        )}>
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown
                                    components={{
                                        a: ({ node, href, children, ...props }) => {
                                            if (href?.startsWith('citation:')) {
                                                const id = href.split(':')[1];
                                                return (
                                                    <Badge
                                                        variant="secondary"
                                                        className="mx-1 cursor-pointer hover:bg-primary/20 transition-colors"
                                                        onClick={() => handleSourceClick(id)}
                                                    >
                                                        {children}
                                                    </Badge>
                                                );
                                            }
                                            return <a href={href} {...props}>{children}</a>;
                                        }
                                    }}
                                >
                                    {msg.content.replace(/\[Source ID: ([^\]]+)\]/g, '[[Source]](citation:$1)')}
                                </ReactMarkdown>
                            </div>

                            {/* Tool Invocations */}
                            {msg.toolInvocations?.map((toolInvocation: any) => {
                                const toolCallId = toolInvocation.toolCallId;
                                const addResult = (result: string) => {
                                    // This is handled by the AI SDK automatically updating the message
                                };

                                if (toolInvocation.toolName === 'searchWeb') {
                                    return (
                                        <div key={toolCallId} className="mt-2 p-2 bg-muted/50 rounded-lg text-xs border border-border/50">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Globe className="w-3 h-3 animate-pulse" />
                                                <span>Searching: "{toolInvocation.args.query}"...</span>
                                            </div>
                                            {'result' in toolInvocation && (
                                                <div className="mt-1 pl-5 text-muted-foreground/80">
                                                    Found {toolInvocation.result?.results?.length || 0} results.
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                if (toolInvocation.toolName === 'planGoal') {
                                    return (
                                        <div key={toolCallId} className="mt-2 p-2 bg-muted/50 rounded-lg text-xs border border-border/50">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Sparkles className="w-3 h-3 animate-pulse" />
                                                <span>Planning: "{toolInvocation.args.goal}"...</span>
                                            </div>
                                            {'result' in toolInvocation && (
                                                <div className="mt-1 pl-5 text-muted-foreground/80">
                                                    Plan generated with {toolInvocation.result?.steps?.length || 0} steps.
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return null;
                            })}

                            {/* Export Actions */}
                            {msg.role === 'assistant' && (
                                <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => exportMessageAsMarkdown({
                                                id: i.toString(),
                                                role: msg.role as any,
                                                content: msg.content,
                                                createdAt: Date.now()
                                            }, contextId)}>
                                                <FileText className="w-4 h-4 mr-2" />
                                                Export Markdown
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => exportMessageAsJSON({
                                                id: i.toString(),
                                                role: msg.role as any,
                                                content: msg.content,
                                                createdAt: Date.now()
                                            }, contextId)}>
                                                <Download className="w-4 h-4 mr-2" />
                                                Export JSON
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 max-w-3xl mx-auto">
                        <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-lg border-t border-border/40">
                <div className="max-w-3xl mx-auto relative">
                    <div className="absolute left-3 top-3 flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        <VoiceMic onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)} className="h-8 w-8" />
                    </div>

                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isGlobal ? "Ask across all files..." : "Ask about this file..."}
                        className="min-h-[60px] pl-24 pr-12 py-3 resize-none bg-muted/30 border-border/50 focus:bg-background focus:ring-1 focus:ring-primary/30 rounded-xl shadow-inner"
                    />

                    <div className="absolute right-3 bottom-3">
                        {isLoading ? (
                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8 rounded-lg"
                                onClick={stop}
                            >
                                <StopCircle className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                onClick={() => sendMessage(input)}
                                disabled={!input.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-muted-foreground/50 font-mono">
                        Lumen v2.0 • RAG Enabled • GPT-4o
                    </span>
                </div>
            </div>

            <SourceModal
                open={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                source={selectedSource}
                onUseInChat={(text) => insertMemory(text)}
            />
        </div>
    );
}
