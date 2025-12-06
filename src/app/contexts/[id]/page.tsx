'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useParams } from 'next/navigation';
import { ContextLayout } from '@/components/context/ContextLayout';
import { ContextNav } from '@/components/context/ContextNav';
import { ContextHeader } from '@/components/context/ContextHeader';
import { WorkspaceChat } from '@/components/context/WorkspaceChat';
import { RightSidebar } from '@/components/workspace/RightSidebar';
import { useContextData } from '@/lib/hooks/useContextData';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { IngestViewer } from '@/components/context/IngestViewer';

export default function ContextWorkspacePage() {
    const params = useParams();
    const id = params.id as string;
    // Hardcoded user ID for now
    const userId = DEMO_USER_ID;

    const { context, chunks, loading, error, refetch } = useContextData(id);
    const insertMemoryRef = useRef<((text: string) => void) | null>(null);

    const [selectedChunk, setSelectedChunk] = useState<any>(null);
    const [editingCapture, setEditingCapture] = useState<any>(null);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Initializing Context Studio...</p>
                </div>
            </div>
        );
    }

    if (error || !context) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Context Not Found</h1>
                    <Link href="/">
                        <Button>Return Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleOpenMemory = (chunkId: string) => {
        const chunk = chunks.find(c => c.id === chunkId);
        if (chunk) {
            setSelectedChunk(chunk);
        }
    };

    const handleUseInChat = (text: string) => {
        // Insert the text into the chat
        if (insertMemoryRef.current) {
            insertMemoryRef.current(text);
        }
    };

    // Calculate unique chunks count
    const uniqueChunks = chunks.reduce((acc: any[], chunk) => {
        if (chunk.capture_id) {
            const exists = acc.find(c => c.capture_id === chunk.capture_id);
            if (!exists) {
                acc.push(chunk);
            }
        } else {
            acc.push(chunk);
        }
        return acc;
    }, []);

    const totalChunks = uniqueChunks.length;

    // Get selected chunk title
    const selectedChunkTitle = selectedChunk
        ? (selectedChunk.captures?.title || selectedChunk.metadata?.title || selectedChunk.content?.slice(0, 30) || 'Untitled')
        : null;

    return (
        <div className="flex flex-col h-screen">
            <ContextHeader
                title={context.name}
                description={context.description}
            />
            <ContextLayout
                nav={<ContextNav contextId={id} chunks={chunks} onSelect={setSelectedChunk} onRefresh={refetch} />}
                workspace={
                    selectedChunk ? (
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={50} minSize={30} className="overflow-hidden">
                                <IngestViewer
                                    chunk={selectedChunk}
                                    onClose={() => setSelectedChunk(null)}
                                    onEdit={() => {
                                        setEditingCapture(selectedChunk);
                                        setSelectedChunk(null);
                                    }}
                                    onRefresh={refetch}
                                />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <WorkspaceChat
                                    key={selectedChunk.id}
                                    contextId={id}
                                    userId={userId}
                                    onInsertRef={(fn) => insertMemoryRef.current = fn}
                                    hideWelcome={true}
                                    onOpenMemory={handleOpenMemory}
                                    captureId={selectedChunk.capture_id}
                                    selectedChunkTitle={selectedChunkTitle}
                                    totalChunks={totalChunks}
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    ) : (
                        <WorkspaceChat
                            key={editingCapture ? `edit-${editingCapture.id}` : 'chat'}
                            contextId={id}
                            userId={userId}
                            onInsertRef={(fn) => insertMemoryRef.current = fn}
                            onOpenMemory={handleOpenMemory}
                            totalChunks={totalChunks}
                            defaultMode={editingCapture ? 'editor' : 'chat'}
                            initialEditorContent={editingCapture?.content || editingCapture?.captures?.raw_text || ''}
                            editorCaptureId={editingCapture?.capture_id || editingCapture?.id}
                            onRefresh={refetch}
                        />
                    )
                }
                intelligence={
                    <RightSidebar
                        contextId={id}
                        userId={userId}
                        onUseInChat={handleUseInChat}
                    />
                }
            />
        </div>
    );
}

