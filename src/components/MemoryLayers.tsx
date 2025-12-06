import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Layers, BrainCircuit } from 'lucide-react';

export function MemoryLayers() {
    // In a real app, we would fetch these stats from an API
    const stats = {
        raw: { count: 1240, label: 'Raw Captures' },
        canonical: { count: 85, label: 'Canonical Memories' },
        abstract: { count: 320, label: 'Concepts & Relations' }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Layer 1: Raw */}
            <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        Layer 1: Raw
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.raw.count}</div>
                    <p className="text-xs text-muted-foreground">Unfiltered inputs</p>
                </CardContent>
            </Card>

            {/* Layer 2: Canonical */}
            <Card className="bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-500" />
                        Layer 2: Canonical
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.canonical.count}</div>
                    <p className="text-xs text-muted-foreground">Deduplicated & Clean</p>
                </CardContent>
            </Card>

            {/* Layer 3: Abstract */}
            <Card className="bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-purple-500" />
                        Layer 3: Abstract
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.abstract.count}</div>
                    <p className="text-xs text-muted-foreground">Knowledge Graph Nodes</p>
                </CardContent>
            </Card>
        </div>
    );
}
