'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ContextSelectorProps {
    userId: string;
    onSelect: (contextId: string) => void;
    selectedContextId?: string;
}

export function ContextSelector({ userId, onSelect, selectedContextId }: ContextSelectorProps) {
    const [contexts, setContexts] = useState<any[]>([]);

    useEffect(() => {
        const fetchContexts = async () => {
            try {
                const res = await fetch(`/api/contexts?userId=${userId}`);
                const data = await res.json();
                const contextList = Array.isArray(data) ? data : data.contexts || [];
                setContexts(contextList);

                // Default to first context if none selected
                if (!selectedContextId && contextList.length > 0) {
                    onSelect(contextList[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch contexts', error);
            }
        };
        fetchContexts();
    }, [userId]);

    return (
        <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-full border">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Ingest into:</Label>
            <Select value={selectedContextId} onValueChange={onSelect}>
                <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0 w-[200px] font-medium">
                    <SelectValue placeholder="Select Context" />
                </SelectTrigger>
                <SelectContent>
                    {contexts.map((ctx) => (
                        <SelectItem key={ctx.id} value={ctx.id}>
                            {ctx.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
