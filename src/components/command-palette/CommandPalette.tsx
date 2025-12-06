'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { CommandInput } from './CommandInput';
import { ResultsList } from './ResultsList';
import { InlineAnswer } from './InlineAnswer';
import { staticCommands, Command } from '@/lib/commands';
import { useRouter } from 'next/navigation';
import { Folder, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function CommandPalette() {
    const { isOpen, close, query, setQuery } = useCommandPalette();
    const router = useRouter();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inlineAnswer, setInlineAnswer] = useState<any>(null);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<{
        commands: Command[];
        contexts: any[];
        captures: any[];
        memories: any[];
    }>({
        commands: [],
        contexts: [],
        captures: [],
        memories: [],
    });

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Real search logic
    useEffect(() => {
        const lowerQuery = query.toLowerCase();

        // Filter static commands client-side
        const filteredCommands = staticCommands.filter(cmd =>
            cmd.title.toLowerCase().includes(lowerQuery) ||
            cmd.keywords?.some(k => k.includes(lowerQuery))
        );

        if (!query) {
            setSearchResults({
                commands: filteredCommands,
                contexts: [],
                captures: [],
                memories: [],
            });
            setInlineAnswer(null);
            return;
        }

        const fetchResults = async () => {
            try {
                const res = await fetch(`/api/palette/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();

                setSearchResults({
                    commands: filteredCommands,
                    contexts: data.contexts || [],
                    captures: data.captures || [],
                    memories: data.memories || [],
                });
            } catch (error) {
                console.error('Search failed', error);
            }
        };

        const fetchAnswer = async () => {
            // Simple heuristic for questions
            const isQuestion = query.length > 10 && (
                query.includes('?') ||
                /^(who|what|where|when|why|how|can|does|is|are)/i.test(query)
            );

            if (!isQuestion) {
                setInlineAnswer(null);
                return;
            }

            setIsQueryLoading(true);
            try {
                const res = await fetch('/api/palette/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                const data = await res.json();
                setInlineAnswer(data);
            } catch (error) {
                console.error('Query failed', error);
            } finally {
                setIsQueryLoading(false);
            }
        };

        // Debounce
        const timeoutId = setTimeout(() => {
            fetchResults();
            fetchAnswer();
        }, 300);
        return () => clearTimeout(timeoutId);

    }, [query]);

    const allItems = useMemo(() => [
        ...searchResults.commands,
        ...searchResults.contexts,
        ...searchResults.captures,
        ...searchResults.memories
    ], [searchResults]);

    const handleExecute = async (item: any) => {
        if (!item) return;

        console.log('Executing:', item);

        // Handle Commands
        if (item.action) {
            if (item.action.type === 'navigate') {
                router.push(item.action.url);
            } else if (item.action.type === 'function') {
                item.action.fn();
            } else if (item.action.type === 'server') {
                // Execute server-side command
                try {
                    // Get current context ID from URL if available
                    const pathParts = window.location.pathname.split('/');
                    const contextId = pathParts[1] === 'contexts' ? pathParts[2] : undefined;

                    const res = await fetch('/api/palette/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            commandId: item.action.commandId,
                            args: { ...item.action.args, contextId },
                            userId: DEMO_USER_ID // Hardcoded for now
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        toast.success(data.message);
                    } else {
                        toast.error(data.error || 'Command failed');
                    }
                } catch (error) {
                    console.error('Failed to execute command', error);
                    toast.error('Failed to execute command');
                }
            }
        }
        // Handle Contexts
        else if (item.name) { // Context
            router.push(`/contexts/${item.id}`);
        }
        // Handle Captures
        else if (item.type) { // Capture
            window.open(`/captures/${item.id}`, '_blank');
        }

        close();
    };

    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % allItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleExecute(allItems[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, allItems, selectedIndex]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="p-0 gap-0 max-w-3xl bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                <DialogTitle className="sr-only">Command Palette</DialogTitle>

                {/* Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                <CommandInput value={query} onChange={setQuery} />

                <InlineAnswer
                    answer={inlineAnswer?.answer}
                    sources={inlineAnswer?.sources || []}
                    isLoading={isQueryLoading}
                    onAction={(action) => {
                        if (action === 'chat') router.push('/chat/default');
                        if (action === 'copy') navigator.clipboard.writeText(inlineAnswer?.answer || '');
                    }}
                />

                <ResultsList
                    results={searchResults}
                    selectedIndex={selectedIndex}
                    onSelect={setSelectedIndex}
                    onExecute={handleExecute}
                />

                <div className="px-4 py-2 border-t border-white/5 bg-white/5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <div className="flex gap-3">
                        <span><kbd className="bg-white/10 px-1 rounded">↵</kbd> to select</span>
                        <span><kbd className="bg-white/10 px-1 rounded">↑↓</kbd> to navigate</span>
                        <span><kbd className="bg-white/10 px-1 rounded">esc</kbd> to close</span>
                    </div>
                    <div>
                        Lumen Neural Palette v1.0
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
