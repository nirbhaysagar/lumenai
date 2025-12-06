'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileText, CheckSquare, Code, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ToolsPanel() {
    const handleRun = (agent: string) => {
        // In a real app, this would trigger an API call
        console.log(`Running agent: ${agent}`);
        // Dispatch event for parent to handle (e.g. show toast)
        window.dispatchEvent(new CustomEvent('agent-triggered', { detail: agent }));
    };

    const tools = [
        {
            label: 'Summarizer',
            description: 'Condense recent memories',
            icon: FileText,
            color: 'text-blue-500'
        },
        {
            label: 'Task Extractor',
            description: 'Find action items',
            icon: CheckSquare,
            color: 'text-green-500'
        },
        {
            label: 'Research Agent',
            description: 'Deep dive topics',
            icon: Bot,
            color: 'text-purple-500',
            comingSoon: true
        }
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Active Agents
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {tools.map((tool, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md bg-background border ${tool.comingSoon ? 'opacity-50' : ''}`}>
                                <tool.icon className={`w-4 h-4 ${tool.color}`} />
                            </div>
                            <div>
                                <div className="text-sm font-medium">{tool.label}</div>
                                <div className="text-xs text-muted-foreground">{tool.description}</div>
                            </div>
                        </div>
                        {!tool.comingSoon && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => window.dispatchEvent(new CustomEvent('run-agent', { detail: tool.label }))}
                            >
                                <Play className="w-3 h-3" />
                            </Button>
                        )}
                        {tool.comingSoon && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
