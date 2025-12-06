import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, StopCircle, Zap, FileText, CheckSquare, Download, Paperclip, ArrowRight } from 'lucide-react';
import { useChat } from 'ai/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ContextChatProps {
    contextId: string;
    userId: string;
    initialInput?: string;
    onInputChange?: (value: string) => void;
}

export function ContextChat({ contextId, userId, initialInput = '', onInputChange }: ContextChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = useChat({
        api: '/api/chat',
        body: {
            userId,
            contextId,
        },
        onError: (error) => {
            toast.error('Failed to send message');
            console.error(error);
        },
        onFinish: () => {
            scrollToBottom();
        }
    });

    // Handle external input changes (e.g. from "Use in Chat")
    useEffect(() => {
        if (initialInput) {
            handleInputChange({ target: { value: initialInput } } as any);
            if (onInputChange) onInputChange(''); // Clear parent state
        }
    }, [initialInput, handleInputChange, onInputChange]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleQuickAction = (action: string) => {
        if (action === 'summarize') {
            setInput('Summarize the key insights from this context.');
            // Ideally auto-submit, but setInput doesn't trigger submit. 
            // We'd need to call append() from useChat, but let's just prepopulate for now.
        } else if (action === 'tasks') {
            setInput('Extract all action items and tasks from these documents.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Chat Header / Summary Area */}
            <div className="p-3 border-b flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-md">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Context Chat</h3>
                        <p className="text-[10px] text-muted-foreground">Llama-3.3-70b • Connected</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => handleQuickAction('summarize')}>
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        Summarize
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => handleQuickAction('tasks')}>
                        <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        Tasks
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6 max-w-3xl mx-auto pb-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                            <div className="p-4 bg-muted/30 rounded-full">
                                <Sparkles className="w-8 h-8 text-primary/50" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium text-foreground">Start thinking with your context</p>
                                <p className="text-sm">Ask questions, summarize documents, or brainstorm ideas.</p>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" size="sm" onClick={() => handleQuickAction('summarize')}>
                                    Summarize Context
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleQuickAction('tasks')}>
                                    Find Tasks
                                </Button>
                            </div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm ${m.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-card border rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                                {/* Citations / Sources */}
                                {m.data && (m.data as any).sources && (
                                    <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                                        {(m.data as any).sources.map((source: any, i: number) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-[10px] font-normal cursor-pointer hover:bg-primary/20 transition-colors flex items-center gap-1 py-0.5 h-5"
                                            >
                                                <FileText className="w-3 h-3 opacity-50" />
                                                src: {source.chunkId.slice(0, 6)}...
                                                <ArrowRight className="w-2 h-2 opacity-50 ml-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-card border rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-75" />
                                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex gap-2 items-end">
                    <Button type="button" size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-foreground">
                        <Paperclip className="w-5 h-5" />
                    </Button>
                    <div className="relative flex-1">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask anything about this context..."
                            className="pr-12 min-h-[44px] py-3"
                            disabled={isLoading}
                        />
                        <div className="absolute right-1 top-1">
                            {isLoading ? (
                                <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => stop()}>
                                    <StopCircle className="w-5 h-5" />
                                </Button>
                            ) : (
                                <Button type="submit" size="icon" variant="ghost" className="h-9 w-9 text-primary" disabled={!input.trim()}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
                <div className="max-w-3xl mx-auto mt-2 flex justify-between text-[10px] text-muted-foreground px-12">
                    <span>AI can make mistakes. Check citations.</span>
                    <span>Llama-3.3-70b</span>
                </div>
            </div>
        </div>
    );
}
