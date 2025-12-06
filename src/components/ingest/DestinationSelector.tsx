'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FolderOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DestinationSelectorProps {
    userId: string;
    onSelect: (contextId: string) => void;
    selectedContextId?: string;
}

export function DestinationSelector({ userId, onSelect, selectedContextId }: DestinationSelectorProps) {
    const [contexts, setContexts] = useState<any[]>([]);

    useEffect(() => {
        const fetchContexts = async () => {
            try {
                const res = await fetch(`/api/contexts?userId=${userId}`);
                const data = await res.json();
                const contextList = Array.isArray(data) ? data : data.contexts || [];
                setContexts(contextList);

                if (!selectedContextId && contextList.length > 0) {
                    onSelect(contextList[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch contexts', error);
            }
        };
        fetchContexts();
    }, [userId]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newContextName, setNewContextName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateContext = async () => {
        if (!newContextName.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch('/api/contexts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name: newContextName, description: 'Created via Intake Portal' }),
            });
            const data = await res.json();
            if (data.context) {
                setContexts(prev => [...prev, data.context]);
                onSelect(data.context.id);
                setIsCreateOpen(false);
                setNewContextName('');
            }
        } catch (error) {
            console.error('Failed to create context', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-primary/20 px-1 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-white/5 hover:ring-primary/30 transition-all duration-300">
                <div className="px-3 py-1.5 flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    <span>Store to:</span>
                </div>

                <Select value={selectedContextId} onValueChange={(val) => {
                    if (val === 'create_new') {
                        setIsCreateOpen(true);
                    } else {
                        onSelect(val);
                    }
                }}>
                    <SelectTrigger className="h-9 border-0 bg-white/5 hover:bg-white/10 focus:ring-0 w-[180px] rounded-full transition-colors font-medium text-foreground">
                        <SelectValue placeholder="Select Context" />
                    </SelectTrigger>
                    <SelectContent>
                        {contexts.map((ctx) => (
                            <SelectItem key={ctx.id} value={ctx.id}>
                                {ctx.name}
                            </SelectItem>
                        ))}
                        <div className="p-1 border-t mt-1">
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted rounded-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsCreateOpen(true);
                                }}
                            >
                                <Plus className="w-3 h-3" /> Create New...
                            </div>
                        </div>
                    </SelectContent>
                </Select>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Workspace</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Workspace Name</Label>
                            <Input
                                placeholder="e.g., Project Alpha"
                                value={newContextName}
                                onChange={(e) => setNewContextName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateContext()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateContext} disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
