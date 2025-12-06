'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { ContextCard } from '@/components/shared/ContextCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function ContextsPage() {
    const [contexts, setContexts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newContext, setNewContext] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    const [editingContext, setEditingContext] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Hardcoded for now
    const userId = DEMO_USER_ID;

    useEffect(() => {
        fetchContexts();
    }, []);

    const fetchContexts = async () => {
        try {
            const res = await fetch(`/api/contexts?userId=${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setContexts(data);
            } else if (data.contexts) {
                setContexts(data.contexts);
            }
        } catch (error) {
            console.error('Failed to fetch workspaces', error);
            toast.error('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newContext.name) return;
        setCreating(true);
        try {
            const res = await fetch('/api/contexts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newContext, userId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Workspace created');
                setIsCreateOpen(false);
                setNewContext({ name: '', description: '' });
                fetchContexts();
            } else {
                toast.error('Failed to create workspace');
            }
        } catch (error) {
            toast.error('Error creating workspace');
        } finally {
            setCreating(false);
        }
    };

    const [contextToDelete, setContextToDelete] = useState<any>(null);

    const handleDelete = (id: string) => {
        const context = contexts.find(c => c.id === id);
        setContextToDelete(context);
    };

    const confirmDelete = async () => {
        if (!contextToDelete) return;

        try {
            const res = await fetch(`/api/contexts/${contextToDelete.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Workspace deleted');
                fetchContexts();
            } else {
                toast.error('Failed to delete workspace');
            }
        } catch (error) {
            toast.error('Error deleting workspace');
        } finally {
            setContextToDelete(null);
        }
    };

    const handleEdit = (context: any) => {
        setEditingContext(context);
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingContext || !editingContext.name) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/contexts/${editingContext.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingContext.name,
                    description: editingContext.description
                }),
            });

            if (res.ok) {
                toast.success('Workspace updated');
                setIsEditOpen(false);
                setEditingContext(null);
                fetchContexts();
            } else {
                toast.error('Failed to update workspace');
            }
        } catch (error) {
            toast.error('Error updating workspace');
        } finally {
            setUpdating(false);
        }
    };

    const filteredContexts = contexts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
                    <p className="text-muted-foreground mt-1">
                        Organize your knowledge into dedicated project spaces.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Workspace
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workspaces..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredContexts.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <h3 className="text-lg font-medium">No workspaces found</h3>
                    <p className="text-muted-foreground mt-1">
                        Create a workspace to start organizing your memories.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                        Create Workspace
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContexts.map((context) => (
                        <ContextCard
                            key={context.id}
                            context={context}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Context</DialogTitle>
                        <DialogDescription>
                            Create a new scope for your chats and documents.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newContext.name}
                                onChange={(e) => setNewContext({ ...newContext, name: e.target.value })}
                                placeholder="Project X"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newContext.description}
                                onChange={(e) => setNewContext({ ...newContext, description: e.target.value })}
                                placeholder="Optional description..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating || !newContext.name}>
                            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Workspace</DialogTitle>
                        <DialogDescription>
                            Update the details of your workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editingContext?.name || ''}
                                onChange={(e) => setEditingContext({ ...editingContext, name: e.target.value })}
                                placeholder="Project X"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editingContext?.description || ''}
                                onChange={(e) => setEditingContext({ ...editingContext, description: e.target.value })}
                                placeholder="Optional description..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={updating || !editingContext?.name}>
                            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!contextToDelete} onOpenChange={(open) => !open && setContextToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workspace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{contextToDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setContextToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
