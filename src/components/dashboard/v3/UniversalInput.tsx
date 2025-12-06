
'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useRef, useEffect } from 'react';
import { Search, MessageSquare, Plus, ArrowRight, Command, FileText, Layers, Brain, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce'; // Assuming we have this or I'll implement simple debounce

import { DynamicGreeting } from './DynamicGreeting';
import { VoiceMic } from './VoiceMic';
import { ChatPanel } from '@/components/workspace/ChatPanel';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import { parseCommand } from '@/lib/command-parser';

interface UniversalInputProps {
  onCreateContext?: (name?: string) => void;
  teamId?: string;
}

export function UniversalInput({ onCreateContext, teamId }: UniversalInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<'auto' | 'chat' | 'search' | 'ingest'>('auto');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Simple debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 1 && mode !== 'ingest') {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, mode]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?userId=${DEMO_USER_ID}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
  };

  // Auto-detect mode based on input
  useEffect(() => {
    if (mode !== 'auto') return;

    const lower = query.toLowerCase();
    if (lower.startsWith('/chat')) setMode('chat');
    else if (lower.startsWith('/search')) setMode('search');
    else if (lower.startsWith('/add')) setMode('ingest');
  }, [query, mode]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!query.trim()) return;

      if (e.metaKey || e.ctrlKey || mode === 'ingest') {
        // Quick Ingest
        await handleQuickIngest();
      } else {
        // Chat or Search or Command
        handleNavigation();
      }
    }
  };

  const handleQuickIngest = async () => {
    const toastId = toast.loading('Saving note...');
    try {
      const res = await fetch('/api/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          raw_text: query,
          title: 'Quick Note',
          user_id: DEMO_USER_ID,
          visible_in_rag: true,
          team_id: teamId,
        }),
      });

      if (res.ok) {
        toast.success('Note saved!', { id: toastId });
        setQuery('');
        setResults(null);
      } else {
        toast.error('Failed to save note', { id: toastId });
      }
    } catch (error) {
      toast.error('Error saving note', { id: toastId });
    }
  };

  const handleNavigation = (forceMode?: 'chat' | 'recall') => {
    const intent = parseCommand(query);

    if (intent.type === 'create_workspace') {
      if (onCreateContext) {
        onCreateContext(intent.name);
        setQuery('');
        setResults(null);
      } else {
        toast.error('Cannot create workspace from here.');
      }
      return;
    }

    if (intent.type === 'navigate') {
      router.push(intent.page);
      return;
    }

    if (intent.type === 'ingest') {
      router.push(`/ingest?url=${encodeURIComponent(intent.url)}`);
      return;
    }

    // Simple heuristic: if it looks like a question, go to chat. Otherwise recall.
    const isQuestion = query.includes('?') || query.toLowerCase().startsWith('who') || query.toLowerCase().startsWith('what');

    if (forceMode === 'chat' || mode === 'chat' || isQuestion) {
      // Inline Chat Expansion
      setExpanded(true);
      setResults(null); // Hide dropdown
    } else {
      router.push(`/recall?q=${encodeURIComponent(query)}`);
    }
  };

  const hasResults = results && (results.contexts?.length > 0 || results.captures?.length > 0 || results.memories?.length > 0);

  if (expanded) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-8 relative z-50 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-muted/20">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-semibold">Ask Lumen</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary onReset={() => setExpanded(false)}>
              <ChatPanel
                contextId=""
                userId={DEMO_USER_ID}
                initialMessage={query}
                defaultToGlobal={true}
                onInsertRef={() => { }}
                hideWelcome={true}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 relative z-50">
      <div
        className={cn(
          "relative group rounded-2xl transition-all duration-300",
          isFocused || hasResults || (query.trim().length > 0 && isFocused) ? "shadow-2xl shadow-primary/20 scale-[1.01]" : "shadow-lg hover:shadow-xl"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />

        <div className={cn(
          "relative bg-background/95 backdrop-blur-xl border border-white/10 overflow-hidden flex flex-col",
          (hasResults || (query.trim().length > 0 && isFocused)) ? "rounded-t-2xl rounded-b-none border-b-0" : "rounded-2xl"
        )}>
          <div className="flex items-center p-2">
            {/* Icon / Mode Indicator */}
            <div className="pl-4 pr-3 text-muted-foreground flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> :
                mode === 'chat' ? <MessageSquare className="w-5 h-5 text-purple-500" /> :
                  mode === 'search' ? <Search className="w-5 h-5 text-blue-500" /> :
                    mode === 'ingest' ? <Plus className="w-5 h-5 text-green-500" /> :
                      <Search className="w-5 h-5" />}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow clicks
              placeholder="Ask anything, search memories, or capture a thought..."
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground/50 h-12"
              autoFocus
            />

            {/* Right Actions */}
            <div className="flex items-center gap-2 pr-2">
              <VoiceMic onTranscript={handleVoiceTranscript} />
              <button
                onClick={() => query && handleNavigation()}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  query ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {(hasResults || (query.trim().length > 0 && isFocused)) && (
          <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-2xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto">
            <div className="p-2 space-y-1">
              {/* Contexts */}
              {results?.contexts?.length > 0 && (
                <div className="px-2 py-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workspaces</h4>
                  {results.contexts.map((ctx: any) => (
                    <div
                      key={ctx.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/contexts/${ctx.id}`)}
                    >
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">{ctx.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Memories */}
              {results?.memories?.length > 0 && (
                <div className="px-2 py-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Memories</h4>
                  {results.memories.map((mem: any) => (
                    <div
                      key={mem.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/memories`)} // Ideally deep link to memory
                    >
                      <Brain className="w-4 h-4 text-purple-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mem.snippet}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Captures */}
              {results?.captures?.length > 0 && (
                <div className="px-2 py-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Files & Links</h4>
                  {results.captures.map((cap: any) => (
                    <div
                      key={cap.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/captures`)} // Ideally deep link
                    >
                      <FileText className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium truncate">{cap.title || 'Untitled'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2 border-t border-border/40 mt-2">
                <div
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors text-primary"
                  onClick={() => handleNavigation('chat')}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Ask Lumen: "{query}"</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <DynamicGreeting />
    </div>
  );
}
