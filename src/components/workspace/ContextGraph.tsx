'use client';

import { KnowledgeGraphWidget } from '@/components/dashboard/KnowledgeGraphWidget';
import { Network } from 'lucide-react';

export function ContextGraph({ contextId }: { contextId: string }) {
    return (
        <div className="h-full p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary" />
                    Knowledge Graph
                </h2>
            </div>
            <div className="flex-1 border rounded-xl bg-muted/10 p-4">
                <KnowledgeGraphWidget />
            </div>
        </div>
    );
}
