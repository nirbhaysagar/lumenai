'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/v3/DashboardHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, Sparkles, Loader2, Tag } from 'lucide-react';
import { MemoryCard } from '@/components/memories/MemoryCard';
import { MemoryDrawer } from '@/components/memories/MemoryDrawer';
import { toast } from 'sonner';

export default function MemoriesPage() {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMemory, setSelectedMemory] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [availableTags, setAvailableTags] = useState<{ name: string; count: number }[]>([]);

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                userId: DEMO_USER_ID,
                limit: '50'
            });

            if (search) params.append('q', search);
            if (selectedType !== 'all') params.append('type', selectedType);
            if (selectedTag !== 'all') params.append('tag', selectedTag);

            const res = await fetch(`/api/memories?${params}`);
            const data = await res.json();
            if (data.memories) {
                setMemories(data.memories);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load memories');
        } finally {
            setLoading(false);
        }
    };

    const fetchTags = async () => {
        try {
            const res = await fetch(`/api/tags?userId=${DEMO_USER_ID}&limit=20`);
            const data = await res.json();
            if (data.tags) {
                setAvailableTags(data.tags);
            }
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(fetchMemories, 300);
        return () => clearTimeout(timeout);
    }, [search, selectedType, selectedTag]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Canonical Library</h1>
                        <p className="text-muted-foreground text-sm">Refined insights and deduplicated knowledge.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={async () => {
                            toast.info('Starting cleanup process...');
                            try {
                                const res = await fetch('/api/admin/dedup', {
                                    method: 'POST',
                                    body: JSON.stringify({ userId: DEMO_USER_ID })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    toast.success(data.message);
                                } else {
                                    toast.error('Failed to start cleanup');
                                }
                            } catch (e) {
                                toast.error('Error triggering cleanup');
                            }
                        }}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Run Cleanup
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search memories..."
                            className="pl-9 bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="pdf">PDF</option>
                            <option value="url">URL</option>
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                        </select>

                        {/* Dynamic Tag Filter */}
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[140px]"
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                        >
                            <option value="all">
                                All Tags {availableTags.length > 0 && `(${availableTags.reduce((sum, t) => sum + t.count, 0)})`}
                            </option>
                            {availableTags.map((tag) => (
                                <option key={tag.name} value={tag.name}>
                                    {tag.name} ({tag.count})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : memories.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">No memories found.</p>
                        <p className="text-xs text-muted-foreground mt-1">Run the summarizer on your contexts to generate insights.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {memories.map(memory => (
                            <MemoryCard
                                key={memory.id}
                                memory={memory}
                                onClick={() => setSelectedMemory(memory)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <MemoryDrawer
                memory={selectedMemory}
                isOpen={!!selectedMemory}
                onClose={() => setSelectedMemory(null)}
            />
        </div>
    );
}
