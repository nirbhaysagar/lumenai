'use client';

import { useState } from 'react';
import { FileText, CheckSquare, Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useSidebarData } from '@/lib/hooks/useSidebarData';
import { ContextSummary } from './ContextSummary';
import { ContextTasks } from './ContextTasks';
import { ContextGraph } from './ContextGraph';
import { PredictiveRecallWidget } from '@/components/dashboard/v3/PredictiveRecallWidget';

interface RightSidebarProps {
    contextId: string;
    userId: string;
    onUseInChat?: (text: string) => void;
}

export function RightSidebar({ contextId, userId, onUseInChat }: RightSidebarProps) {
    const { loading, refetch } = useSidebarData(contextId);
    const [activeTab, setActiveTab] = useState('summary');

    return (
        <div className="flex flex-col h-full bg-muted/5 border-l border-border/40 w-full">
            <div className="p-4 border-b border-border/40 bg-background/50 backdrop-blur-sm flex justify-between items-center">
                <h2 className="text-sm font-semibold text-foreground/80">Intelligence</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refetch}>
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b px-4 py-2 bg-muted/20">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary" className="gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="hidden lg:inline">Summary</span>
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="gap-2">
                            <CheckSquare className="w-4 h-4" />
                            <span className="hidden lg:inline">Tasks</span>
                        </TabsTrigger>
                        <TabsTrigger value="graph" className="gap-2">
                            <Network className="w-4 h-4" />
                            <span className="hidden lg:inline">Graph</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="summary" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <div className="p-4 space-y-4">
                            <PredictiveRecallWidget userId={userId} />
                            <ContextSummary contextId={contextId} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <div className="p-4">
                            <ContextTasks contextId={contextId} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="graph" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden h-full">
                    <ContextGraph contextId={contextId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
