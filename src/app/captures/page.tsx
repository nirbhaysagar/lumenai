'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/v3/DashboardHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, RefreshCw, Plus, Loader2, Trash2 } from 'lucide-react';
import { CaptureCard } from '@/components/captures/CaptureCard';
import { CaptureDrawer } from '@/components/captures/CaptureDrawer';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CapturesPage() {
    const [captures, setCaptures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string | null>(null);
    const [selectedCapture, setSelectedCapture] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pdf', label: 'PDF' },
        { id: 'url', label: 'URL' },
        { id: 'text', label: 'Text' },
        { id: 'image', label: 'Image' },
    ];

    const fetchCaptures = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                userId: DEMO_USER_ID, // Hardcoded
                limit: '50'
            });

            if (filterType && filterType !== 'all') params.append('type', filterType);
            if (search) params.append('q', search);

            const res = await fetch(`/api/captures?${params}`);
            const data = await res.json();
            if (data.captures) {
                setCaptures(data.captures);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load captures');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(fetchCaptures, 300);
        return () => clearTimeout(timeout);
    }, [search, filterType]);

    const handleSelect = (id: string, selected: boolean) => {
        const newSelected = new Set(selectedIds);
        if (selected) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

        try {
            const ids = Array.from(selectedIds).join(',');
            const res = await fetch(`/api/captures?id=${ids}`, { method: 'DELETE' });

            if (!res.ok) throw new Error('Failed to delete');

            setCaptures(prev => prev.filter(c => !selectedIds.has(c.id)));
            setSelectedIds(new Set());
            toast.success(`${selectedIds.size} captures deleted`);
        } catch (error) {
            toast.error('Failed to delete captures');
        }
    };

    const handleAction = async (action: string, capture: any) => {
        if (action === 'delete') {
            try {
                const res = await fetch(`/api/captures?id=${capture.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete');
                setCaptures(prev => prev.filter(c => c.id !== capture.id));
                toast.success('Capture deleted');
            } catch (error) {
                toast.error('Failed to delete capture');
            }
        } else if (action === 'pin') {
            try {
                const res = await fetch('/api/captures', {
                    method: 'PATCH',
                    body: JSON.stringify({ id: capture.id, pinned: !capture.pinned })
                });
                if (!res.ok) throw new Error('Failed to pin');
                setCaptures(prev => prev.map(c => c.id === capture.id ? { ...c, pinned: !c.pinned } : c));
                toast.success(capture.pinned ? 'Capture unpinned' : 'Capture pinned');
            } catch (error) {
                toast.error('Failed to update pin status');
            }
        } else if (action === 'summarize') {
            toast.info('Summarization job queued.');
            // Implement actual API call here
        } else if (action === 'assign') {
            // Open context assignment dialog (future)
            toast.info('Context assignment dialog coming soon.');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <DashboardHeader />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Captures Inbox</h1>
                        <p className="text-muted-foreground text-sm">Manage your raw inputs and processing pipeline.</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedIds.size > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Selected ({selectedIds.size})
                            </Button>
                        )}
                        <Button variant="outline" onClick={fetchCaptures}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={() => router.push('/ingest')}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Upload
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/20 p-4 rounded-xl border border-border/40">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search captures..."
                            className="pl-9 bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
                        {filters.map(f => (
                            <Button
                                key={f.id}
                                variant={filterType === f.id || (f.id === 'all' && !filterType) ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setFilterType(f.id === 'all' ? null : f.id)}
                                className="whitespace-nowrap"
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : captures.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">No captures found.</p>
                        <Button variant="link" onClick={() => router.push('/ingest')}>Upload something</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {captures.map(capture => (
                            <CaptureCard
                                key={capture.id}
                                capture={capture}
                                selected={selectedIds.has(capture.id)}
                                onSelect={(selected) => handleSelect(capture.id, selected)}
                                onClick={() => setSelectedCapture(capture)}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </main>

            <CaptureDrawer
                capture={selectedCapture}
                isOpen={!!selectedCapture}
                onClose={() => setSelectedCapture(null)}
                onAction={handleAction}
            />
        </div>
    );
}
