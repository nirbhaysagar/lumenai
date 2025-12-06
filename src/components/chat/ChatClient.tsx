'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Send, Loader2, ArrowDown } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchStreamingChat, StreamCallbacks } from '@/lib/streamingFetch';
import { ChatMessage } from './ExportUtils';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { SourceModal } from './SourceModal';
import { TokenBadge } from '@/components/shared/TokenBadge';

interface ChatClientProps {
    contextId: string;
    captureId?: string;
    initialMessages?: ChatMessage[];
    userId: string; // Passed from server page
    className?: string;
    initialInput?: string;
    onInputChange?: (value: string) => void;
}

export default function ChatClient({ contextId, captureId, initialMessages = [], userId, className, initialInput = '', onInputChange }: ChatClientProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState(initialInput);
    const [isStreaming, setIsStreaming] = useState(false);
    const [queueBacklog, setQueueBacklog] = useState(0);
    const [selectedSource, setSelectedSource] = useState<any>(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync input from parent if provided
    useEffect(() => {
        if (initialInput) {
            setInput(initialInput);
        }
    }, [initialInput]);

    // Handle input change wrapper
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInput(newValue);
        if (onInputChange) {
            onInputChange(newValue);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isStreaming]);

    // Poll queue stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/admin/stats');
                if (res.data.queueBacklog !== undefined) {
                    setQueueBacklog(res.data.queueBacklog);
                }
            } catch (e) {
                console.error('Failed to fetch stats', e);
            }
        };

        fetchStats(); // Initial fetch
        const interval = setInterval(fetchStats, 8000);
        return () => clearInterval(interval);
    }, []);

    // Cleanup abort controller
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;

        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: input,
            createdAt: Date.now(),
        };

        const assistantMessageId = uuidv4();
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInput('');
        if (onInputChange) onInputChange(''); // Clear parent state
        setIsStreaming(true);

        abortControllerRef.current = new AbortController();

        const callbacks: StreamCallbacks = {
            onToken: (token) => {
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + token }
                        : msg
                ));
            },
            onMetadata: (metadata) => {
                if (metadata && metadata.sources) {
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, sources: metadata.sources }
                            : msg
                    ));
                }
            },
            onError: (error) => {
                console.error('Streaming error:', error);
                toast.error('Failed to send message. Please try again.');
                setIsStreaming(false);
            },
            onComplete: () => {
                setIsStreaming(false);
            }
        };

        await fetchStreamingChat(
            '/api/chat',
            {
                messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                userId,
                contextId,
                captureId
            },
            callbacks,
            abortControllerRef.current.signal
        );
    };

    const handleSaveSummary = async (message: ChatMessage) => {
        try {
            toast.loading('Generating summary...');
            const payload = {
                contextId,
                chunkIds: message.sources?.map((s: any) => s.chunkId)
            };

            const finalPayload = (payload.chunkIds && payload.chunkIds.length > 0)
                ? { chunkIds: payload.chunkIds }
                : { contextId };

            const res = await axios.post('/api/agent/summarize', finalPayload);

            toast.dismiss();
            toast.success('Summary saved successfully!');
        } catch (e) {
            toast.dismiss();
            toast.error('Failed to save summary');
        }
    };

    const handleCitationClick = (source: any) => {
        setSelectedSource(source);
        setIsSourceModalOpen(true);
    };

    const handleUseInChat = (text: string) => {
        const newValue = input + (input ? '\n\n' : '') + `> ${text}\n\n`;
        setInput(newValue);
        if (onInputChange) onInputChange(newValue);
    };



    // Calculate total tokens for session (mock estimation for now as we don't persist it in state yet)
    // In a real app, we'd sum up usage from message metadata
    const totalTokens = messages.reduce((acc, msg) => {
        return acc + ((msg as any).metadata?.usage?.totalTokens || 0);
    }, 0);
    const totalCost = totalTokens * (0.70 / 1000000); // Mock pricing for Llama 3.3 ($0.70/1M)

    return (
        <div className={`flex flex-col h-full bg-background ${className || ''}`}>
            {/* Chat Header with Token Badge */}
            <div className="px-4 py-2 border-b flex justify-between items-center bg-muted/10">
                <span className="text-xs font-medium text-muted-foreground">Chat Session</span>
                <TokenBadge tokens={totalTokens} cost={totalCost} />
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            contextId={contextId}
                            onCitationClick={handleCitationClick}
                            onSaveSummary={() => handleSaveSummary(msg)}
                            isStreaming={isStreaming && msg.id === messages[messages.length - 1].id && msg.role === 'assistant'}
                        />
                    ))}

                    {(isStreaming && messages[messages.length - 1].content === '') || (queueBacklog > 5 && isStreaming) ? (
                        <ThinkingIndicator queueBacklog={queueBacklog} />
                    ) : null}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                        disabled={isStreaming}
                        className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={isStreaming || !input.trim()}>
                        {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            <SourceModal
                open={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                source={selectedSource}
                onUseInChat={handleUseInChat}
            />
        </div>
    );
}
