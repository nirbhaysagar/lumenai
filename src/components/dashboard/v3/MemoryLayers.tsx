'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Database, Layers, Network, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MemoryLayers({ counts }: { counts: { raw: number, canonical: number, concepts: number } }) {
    const router = useRouter();

    const layers = [
        {
            id: 'raw',
            label: 'Raw Captures',
            count: counts?.raw || 0,
            icon: Database,
            color: 'text-slate-400',
            borderColor: 'border-slate-500/20',
            path: '/captures'
        },
        {
            id: 'canonical',
            label: 'Canonical Memories',
            count: counts?.canonical || 0,
            icon: Layers,
            color: 'text-blue-400',
            borderColor: 'border-blue-500/20',
            path: '/memories'
        },
        {
            id: 'concepts',
            label: 'Knowledge Graph',
            count: counts?.concepts || 0,
            icon: Network,
            color: 'text-purple-400',
            borderColor: 'border-purple-500/20',
            path: '/graph'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layers.map((layer, i) => (
                <div
                    key={layer.id}
                    className="relative group cursor-pointer"
                    onClick={() => router.push(layer.path)}
                >
                    <Card className={`h-full border ${layer.borderColor} bg-card/50 hover:bg-card transition-colors`}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg bg-background border border-border`}>
                                    <layer.icon className={`w-6 h-6 ${layer.color}`} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{layer.count}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{layer.label}</div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                    </Card>

                    {/* Connector Line (except last) */}
                    {i < layers.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-[2px] bg-border z-10" />
                    )}
                </div>
            ))}
        </div>
    );
}
