'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';

export function ContinueSession() {
    // Mock data - in real app, fetch from /api/user/last-activity
    const lastSession = {
        contextId: '123', // Mock ID
        contextName: 'Startup / SaaS ideas',
        lastAction: 'You asked: "What are the main takeaways?"',
        lastDocument: 'PDF Upload - LLM Research',
        time: '13 minutes ago'
    };

    return (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <Clock className="w-4 h-4" />
                        Continue your last session
                    </div>
                    <h3 className="text-lg font-bold">{lastSession.contextName}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            <span>Analyzing: <span className="text-foreground">{lastSession.lastDocument}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" />
                            <span>{lastSession.lastAction}</span>
                        </div>
                    </div>
                </div>

                <Link href={`/contexts/${lastSession.contextId}`}>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        Open Workspace <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
