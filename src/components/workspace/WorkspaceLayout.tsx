import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { KnowledgeBrowser } from './KnowledgeBrowser';
import { ContextChat } from './ContextChat';
import { ContextSummary } from './ContextSummary';
import { ContextTasks } from './ContextTasks';
import { ContextGraph } from './ContextGraph';
import { WorkspaceFAB } from './WorkspaceFAB';
import { useState, useEffect } from 'react';
import { useMediaQuery } from "@/hooks/use-media-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, MessageSquare, FileText, CheckSquare, Network } from "lucide-react";

interface WorkspaceLayoutProps {
    contextId: string;
    userId: string;
}

export function WorkspaceLayout({ contextId, userId }: WorkspaceLayoutProps) {
    const [chatInput, setChatInput] = useState('');
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleUseInChat = (text: string) => {
        setChatInput(text);
        setActiveTab('chat'); // Switch to chat when using content
    };

    if (!mounted) return null;

    // Shared Tabs Content for both Mobile and Desktop to avoid duplication
    const TabsContentArea = () => (
        <>
            <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                <ContextChat
                    contextId={contextId}
                    userId={userId}
                    initialInput={chatInput}
                    onInputChange={setChatInput}
                />
            </TabsContent>
            <TabsContent value="summary" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                <ContextSummary contextId={contextId} />
            </TabsContent>
            <TabsContent value="tasks" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                <ContextTasks contextId={contextId} />
            </TabsContent>
            <TabsContent value="graph" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                <ContextGraph contextId={contextId} />
            </TabsContent>
        </>
    );

    const TabsListArea = () => (
        <div className="border-b px-4 py-2 bg-muted/20">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="w-4 h-4" /> <span className="hidden lg:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="summary" className="gap-2">
                    <FileText className="w-4 h-4" /> <span className="hidden lg:inline">Summary</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                    <CheckSquare className="w-4 h-4" /> <span className="hidden lg:inline">Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="graph" className="gap-2">
                    <Network className="w-4 h-4" /> <span className="hidden lg:inline">Graph</span>
                </TabsTrigger>
            </TabsList>
        </div>
    );

    if (!isDesktop) {
        return (
            <div className="h-full flex flex-col overflow-hidden relative">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="border-b px-4 py-2 bg-muted/20">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="knowledge" className="gap-2">
                                <Layers className="w-4 h-4" />
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="gap-2"><MessageSquare className="w-4 h-4" /></TabsTrigger>
                            <TabsTrigger value="summary" className="gap-2"><FileText className="w-4 h-4" /></TabsTrigger>
                            <TabsTrigger value="tasks" className="gap-2"><CheckSquare className="w-4 h-4" /></TabsTrigger>
                            <TabsTrigger value="graph" className="gap-2"><Network className="w-4 h-4" /></TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="knowledge" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                        <KnowledgeBrowser
                            contextId={contextId}
                            onUseInChat={handleUseInChat}
                        />
                    </TabsContent>
                    <TabsContentArea />
                </Tabs>
                <WorkspaceFAB />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden relative">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Left Panel: Knowledge Browser (35%) */}
                <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
                    <KnowledgeBrowser
                        contextId={contextId}
                        onUseInChat={handleUseInChat}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Panel: Tabs (65%) */}
                <ResizablePanel defaultSize={65} minSize={30}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsListArea />
                        <TabsContentArea />
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
            <WorkspaceFAB />
        </div>
    );
}
