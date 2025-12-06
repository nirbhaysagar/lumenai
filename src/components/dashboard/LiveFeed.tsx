'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle2, FileText, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LiveFeed() {
    // Mock events
    const events = [
        { id: 1, text: 'PDF processed → 18 chunks created', time: '2m ago', icon: <FileText className="w-3 h-3 text-blue-500" /> },
        { id: 2, text: 'Embedding worker processed chunk #1849', time: '2m ago', icon: <Zap className="w-3 h-3 text-yellow-500" /> },
        { id: 3, text: 'Task extractor found 3 tasks in Notebook', time: '5m ago', icon: <CheckCircle2 className="w-3 h-3 text-green-500" /> },
        { id: 4, text: 'Dedup worker merged 2 similar chunks', time: '12m ago', icon: <Activity className="w-3 h-3 text-purple-500" /> },
        { id: 5, text: 'Ingested "Project Plan.pdf"', time: '15m ago', icon: <FileText className="w-3 h-3 text-muted-foreground" /> },
    ];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Live Feed
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
                <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="flex gap-3 items-start">
                                <div className="mt-1 p-1 bg-muted rounded-full">
                                    {event.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-medium">{event.text}</p>
                                    <p className="text-[10px] text-muted-foreground">{event.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
