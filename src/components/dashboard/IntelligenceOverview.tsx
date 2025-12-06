'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lightbulb, Tag, Network, FileText } from 'lucide-react';
import { KnowledgeGraphWidget } from './KnowledgeGraphWidget';

export function IntelligenceOverview() {
    // Mock data - replace with real stats from API
    const stats = [
        { label: 'New Summaries', value: 3, icon: <FileText className="w-4 h-4 text-blue-500" /> },
        { label: 'Insights Extracted', value: 8, icon: <Lightbulb className="w-4 h-4 text-yellow-500" /> },
        { label: 'Tags Added', value: 5, icon: <Tag className="w-4 h-4 text-green-500" /> },
        { label: 'Concepts Linked', value: 1, icon: <Network className="w-4 h-4 text-purple-500" /> },
    ];

    return (
        <div className="space-y-4">
            <KnowledgeGraphWidget />

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        Today's Stats
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {stat.icon}
                                    <span>{stat.label}</span>
                                </div>
                                <span className="font-bold">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
