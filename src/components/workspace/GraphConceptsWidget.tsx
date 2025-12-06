'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Network } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function GraphConceptsWidget({ contextId }: { contextId: string }) {
    const [concepts, setConcepts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Placeholder for graph concepts fetching
        // In a real app, this would call /api/agent/find-concepts or similar
        const fetchConcepts = async () => {
            try {
                const res = await fetch(`/api/contexts/${contextId}/concepts`);
                const data = await res.json();
                if (data.concepts) {
                    setConcepts(data.concepts);
                }
            } catch (error) {
                console.error('Failed to fetch concepts', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConcepts();
    }, [contextId]);

    if (loading) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Network className="w-3 h-3" /> Key Concepts
            </div>
            <div className="flex flex-wrap gap-2">
                {concepts.map((concept) => (
                    <Badge
                        key={concept.id}
                        variant="outline"
                        className="text-[10px] px-2 py-1 h-auto cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        {concept.label}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
