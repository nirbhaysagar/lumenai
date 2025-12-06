'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Server, Zap } from 'lucide-react';

export function SystemStats({ queues }: { queues: any }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    System Intelligence
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Embeddings Queue
                        </span>
                        <span className={queues?.embeddings > 0 ? "text-yellow-500" : "text-green-500"}>
                            {queues?.embeddings > 0 ? `${queues.embeddings} pending` : 'Idle'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Server className="w-3 h-3" /> Dedup Worker
                        </span>
                        <span className={queues?.dedup > 0 ? "text-blue-500" : "text-green-500"}>
                            {queues?.dedup > 0 ? `${queues.dedup} active` : 'Idle'}
                        </span>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Vector DB Health</div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
