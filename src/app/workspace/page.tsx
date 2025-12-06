'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useRef, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MemoryNavigator } from '@/components/workspace/MemoryNavigator';
import { ChatPanel } from '@/components/workspace/ChatPanel';
import { RightSidebar } from '@/components/workspace/RightSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Settings, Globe } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DragDropProvider } from '@/components/workspace/DragDropProvider';


export default function GlobalWorkspacePage() {
    // Hardcoded user ID for now
    const userId = DEMO_USER_ID;
    const contextId = 'global'; // Magic ID for global scope

    const insertMemoryRef = useRef<((text: string) => void) | null>(null);
    const [selectedChunk, setSelectedChunk] = useState<any>(null);

    const handleInsertMemory = (text: string) => {
        if (insertMemoryRef.current) {
            insertMemoryRef.current(text);
        }
    };

    return (
        <DragDropProvider>
            <div className="h-screen flex flex-col overflow-hidden bg-background font-sans">
                {/* Header */}
                <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5">
                                <Globe className="w-4 h-4 text-cyan-500" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold flex items-center gap-2">
                                    Global Workspace
                                    <Badge variant="outline" className="font-mono text-[10px] h-4 px-1 text-muted-foreground">
                                        System
                                    </Badge>
                                </h1>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                    Your central thinking terminal
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                            <Share2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                            <Settings className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                </header>

                {/* 3-Panel Workspace */}
                <div className="flex-1 overflow-hidden">
                    <ResizablePanelGroup direction="horizontal">

                        {/* Left: Memory Navigator */}
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted/5">
                            <MemoryNavigator
                                contextId={contextId}
                                onInsert={handleInsertMemory}
                                selectedChunk={selectedChunk}
                                onSelectChunk={setSelectedChunk}
                            />
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-border/20 hover:bg-primary/50 transition-colors w-1" />

                        {/* Center: Chat Workspace */}
                        <ResizablePanel defaultSize={55} minSize={30}>
                            <ChatPanel
                                contextId={contextId}
                                userId={userId}
                                onInsertRef={(fn) => insertMemoryRef.current = fn}
                                onOpenMemory={setSelectedChunk}
                                captureId={selectedChunk?.id}
                                selectedChunkTitle={selectedChunk?.metadata?.title}
                            />
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-border/20 hover:bg-primary/50 transition-colors w-1" />

                        {/* Right: Intelligence Sidebar */}
                        <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="bg-muted/5">
                            <RightSidebar contextId={contextId} userId={userId} />
                        </ResizablePanel>

                    </ResizablePanelGroup>
                </div>
            </div>

        </DragDropProvider>
    );
}
