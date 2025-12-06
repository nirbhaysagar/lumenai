'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileSearch, Layers, ListTodo } from 'lucide-react';

export function AgentStatus() {
    const agents = [
        { name: 'Summarizer', status: 'online', activity: '4 docs processed', icon: <Bot className="w-4 h-4" /> },
        { name: 'Topicer', status: 'online', activity: '12 tags added', icon: <FileSearch className="w-4 h-4" /> },
        { name: 'Dedup', status: 'idle', activity: '3 duplicates cleaned', icon: <Layers className="w-4 h-4" /> },
        { name: 'Task Extractor', status: 'online', activity: '6 todos found', icon: <ListTodo className="w-4 h-4" /> },
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Your Agents
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    {agents.map((agent, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-background rounded-md shadow-sm">
                                    {agent.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        {agent.name}
                                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                                            }`} />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{agent.activity}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
