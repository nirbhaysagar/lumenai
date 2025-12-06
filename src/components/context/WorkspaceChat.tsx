'use client';

import { useState } from 'react';
import { MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatPanel } from '@/components/workspace/ChatPanel';
import { DocumentEditor } from './DocumentEditor';
import { cn } from '@/lib/utils';

interface WorkspaceChatProps {
    contextId: string;
    userId: string;
    onInsertRef: (fn: (text: string) => void) => void;
    hideWelcome?: boolean;
    onOpenMemory?: (chunkId: string) => void;
    captureId?: string | null;
    selectedChunkTitle?: string | null;
    totalChunks?: number;
    initialEditorContent?: string;
    editorCaptureId?: string | null;
    defaultMode?: 'chat' | 'editor';
    onRefresh?: () => void;
}

export function WorkspaceChat({
    contextId,
    userId,
    onInsertRef,
    hideWelcome,
    onOpenMemory,
    captureId,
    selectedChunkTitle,
    totalChunks,
    initialEditorContent,
    editorCaptureId,
    defaultMode = 'chat',
    onRefresh
}: WorkspaceChatProps) {
    const [mode, setMode] = useState<'chat' | 'editor'>(defaultMode);

    return (
        <div className="flex flex-col h-full relative">
            {/* Mode Toggle (Floating) */}
            {/* Mode Toggle (Floating) */}
            <div className="absolute top-14 md:top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-full p-1 flex gap-1 shadow-sm transition-all duration-300">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('chat')}
                    className={cn(
                        "h-7 px-3 rounded-full text-xs gap-1.5 transition-all",
                        mode === 'chat' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <MessageSquare className="w-3 h-3" />
                    Chat
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('editor')}
                    className={cn(
                        "h-7 px-3 rounded-full text-xs gap-1.5 transition-all",
                        mode === 'editor' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <FileText className="w-3 h-3" />
                    Editor
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {mode === 'chat' ? (
                    <ChatPanel
                        contextId={contextId}
                        userId={userId}
                        onInsertRef={onInsertRef}
                        hideWelcome={hideWelcome}
                        onOpenMemory={onOpenMemory}
                        captureId={captureId}
                        selectedChunkTitle={selectedChunkTitle}
                        totalChunks={totalChunks}
                    />
                ) : (
                    <DocumentEditor
                        contextId={contextId}
                        initialContent={initialEditorContent}
                        captureId={editorCaptureId}
                        onSave={onRefresh}
                    />
                )}
            </div>
        </div>
    );
}
