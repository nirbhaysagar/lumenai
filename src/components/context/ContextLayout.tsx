'use client';

import { ReactNode, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Menu, PanelRight, PanelLeft } from 'lucide-react';

interface ContextLayoutProps {
    nav: ReactNode;
    workspace: ReactNode;
    intelligence: ReactNode;
}

export function ContextLayout({ nav, workspace, intelligence }: ContextLayoutProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [isLeftOpen, setIsLeftOpen] = useState(false);
    const [isRightOpen, setIsRightOpen] = useState(false);

    if (!isDesktop) {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-background font-sans relative">
                {/* Mobile Toolbar */}
                <div className="flex items-center justify-between p-2 border-b bg-muted/10">
                    <Sheet open={isLeftOpen} onOpenChange={setIsLeftOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <PanelLeft className="w-4 h-4" />
                                <span className="text-xs">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[85%] sm:w-[350px]">
                            {nav}
                        </SheetContent>
                    </Sheet>

                    <Sheet open={isRightOpen} onOpenChange={setIsRightOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <span className="text-xs">Intelligence</span>
                                <PanelRight className="w-4 h-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-[85%] sm:w-[350px]">
                            {intelligence}
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 overflow-hidden relative">
                    {workspace}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background font-sans">
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    {/* Left: Context Nav */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted/5 border-r border-border/40">
                        {nav}
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border/20 hover:bg-primary/50 transition-colors w-1" />

                    {/* Center: Main Workspace */}
                    <ResizablePanel defaultSize={55} minSize={30}>
                        {workspace}
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border/20 hover:bg-primary/50 transition-colors w-1" />

                    {/* Right: Intelligence Panel */}
                    <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="bg-muted/5 border-l border-border/40">
                        {intelligence}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
