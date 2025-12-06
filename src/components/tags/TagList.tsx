'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'; // I'll assume I can create this or use standard HTML if it fails
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MoreHorizontal, Pencil, Trash2, Merge, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
    id: string;
    name: string;
    count: number;
    created_at: string;
}

export function TagList() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    // Edit State
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [editName, setEditName] = useState('');

    // Merge State
    const [mergingTag, setMergingTag] = useState<Tag | null>(null);
    const [targetTagId, setTargetTagId] = useState<string>('');

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/tags');
            const data = await res.json();
            if (data.tags) {
                setTags(data.tags);
            }
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            toast.error('Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTagName.trim()) return;
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName }),
            });
            if (!res.ok) throw new Error('Failed to create tag');
            toast.success('Tag created');
            setNewTagName('');
            setIsCreateOpen(false);
            fetchTags();
        } catch (error) {
            toast.error('Failed to create tag');
        }
    };

    const handleRename = async () => {
        if (!editingTag || !editName.trim()) return;
        try {
            const res = await fetch(`/api/tags/${editingTag.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName }),
            });
            if (!res.ok) throw new Error('Failed to rename tag');
            toast.success('Tag renamed');
            setEditingTag(null);
            fetchTags();
        } catch (error) {
            toast.error('Failed to rename tag');
        }
    };

    const handleMerge = async () => {
        if (!mergingTag || !targetTagId) return;
        try {
            const res = await fetch('/api/tags/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: mergingTag.id, targetId: targetTagId }),
            });
            if (!res.ok) throw new Error('Failed to merge tags');
            const data = await res.json();
            toast.success(`Merged ${data.moved} items`);
            setMergingTag(null);
            fetchTags();
        } catch (error) {
            toast.error('Failed to merge tags');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tag?')) return;
        try {
            const res = await fetch(`/api/tags/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete tag');
            toast.success('Tag deleted');
            fetchTags();
        } catch (error) {
            toast.error('Failed to delete tag');
        }
    };

    const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Create Tag</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Tag</DialogTitle>
                        </DialogHeader>
                        <Input
                            placeholder="Tag name"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <DialogFooter>
                            <Button onClick={handleCreate}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Usage</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredTags.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No tags found</td></tr>
                        ) : (
                            filteredTags.map((tag) => (
                                <tr key={tag.id} className="border-t hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-medium">{tag.name}</td>
                                    <td className="p-4 text-muted-foreground">{tag.count} items</td>
                                    <td className="p-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingTag(tag);
                                                    setEditName(tag.name);
                                                }}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setMergingTag(tag)}>
                                                    <Merge className="mr-2 h-4 w-4" /> Merge into...
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tag.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Tag</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                    />
                    <DialogFooter>
                        <Button onClick={handleRename}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Merge Dialog */}
            <Dialog open={!!mergingTag} onOpenChange={(open) => !open && setMergingTag(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Merge "{mergingTag?.name}" into...</DialogTitle>
                        <DialogDescription>
                            Select the tag you want to merge this into. "{mergingTag?.name}" will be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                        {tags.filter(t => t.id !== mergingTag?.id).map(t => (
                            <div
                                key={t.id}
                                className={`p-2 rounded cursor-pointer hover:bg-muted ${targetTagId === t.id ? 'bg-primary/10 text-primary' : ''}`}
                                onClick={() => setTargetTagId(t.id)}
                            >
                                <div className="font-medium">{t.name}</div>
                                <div className="text-xs text-muted-foreground">{t.count} items</div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleMerge} disabled={!targetTagId}>Merge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
