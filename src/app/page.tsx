'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/v3/DashboardHeader';
import { QuickActions } from '@/components/dashboard/v3/QuickActions';
import { MemoryLayers } from '@/components/dashboard/v3/MemoryLayers';
import { ContextGrid } from '@/components/dashboard/ContextGrid';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MiniRecallWidget } from '@/components/dashboard/v3/MiniRecallWidget';
import { RecallStatsCard } from '@/components/dashboard/v3/RecallStatsCard';
import { ImplicitMemoryWidget } from '@/components/dashboard/v3/ImplicitMemoryWidget';
import { SystemStats } from '@/components/dashboard/v3/SystemStats';
import { KnowledgeRadar } from '@/components/dashboard/v3/KnowledgeRadar';
import { ToolsPanel } from '@/components/dashboard/v3/ToolsPanel';
import { UniversalInput } from '@/components/dashboard/v3/UniversalInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Github, AlertCircle, Book } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Dashboard() {
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContext, setNewContext] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('teamId') || undefined;

  // Hardcoded for now
  const userId = DEMO_USER_ID;

  useEffect(() => {
    fetchContexts();
    fetchStats();

    const handleAgentRun = (e: any) => toast.info(`Agent triggered: ${e.detail}`);
    const handleLayerClick = (e: any) => toast.info(`Filtering by layer: ${e.detail}`);

    window.addEventListener('run-agent', handleAgentRun);
    window.addEventListener('layer-click', handleLayerClick);

    // Poll for failures
    const checkFailures = async () => {
      try {
        const res = await fetch(`/api/activity?userId=${userId}`);
        const data = await res.json();
        if (data.activities) {
          const failed = data.activities.find((a: any) => a.status === 'failed' && new Date(a.timestamp) > new Date(Date.now() - 10000)); // Last 10s
          if (failed) {
            toast.error(`Ingestion Failed: ${failed.title}`, {
              description: failed.error || 'Unknown error occurred during processing.'
            });
          }
        }
      } catch (e) {
        console.error('Error polling', e);
      }
    };
    const failureInterval = setInterval(checkFailures, 10000);

    return () => {
      window.removeEventListener('run-agent', handleAgentRun);
      window.removeEventListener('layer-click', handleLayerClick);
      clearInterval(failureInterval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats?userId=${userId}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

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
      console.error('Failed to fetch contexts', error);
      toast.error('Failed to load contexts');
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
        toast.success('Context created');
        setIsCreateOpen(false);
        setNewContext({ name: '', description: '' });
        fetchContexts();
        fetchStats();
      } else {
        toast.error('Failed to create context');
      }
    } catch (error) {
      toast.error('Error creating context');
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
        toast.success('Context deleted');
        fetchContexts();
        fetchStats();
      } else {
        toast.error('Failed to delete context');
      }
    } catch (error) {
      toast.error('Error deleting context');
    } finally {
      setContextToDelete(null);
    }
  };

  const openCreateDialog = (name?: string) => {
    if (name) setNewContext(prev => ({ ...prev, name }));
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Header Bar */}
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-8">

        {/* 1.5. Universal Input */}
        <UniversalInput onCreateContext={openCreateDialog} teamId={teamId} />

        {/* 2. Quick Actions Row */}
        <QuickActions
          onIngest={() => router.push('/ingest')}
          onCreateContext={() => setIsCreateOpen(true)}
        />

        {/* 3. Memory Layers Overview */}
        <MemoryLayers counts={stats?.memoryCounts} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">

            {/* 4. Active Contexts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Active Workspaces</h2>
                <Button variant="ghost" size="sm" onClick={() => router.push('/contexts')}>View All</Button>
              </div>
              <ContextGrid
                contexts={contexts} // ContextGrid handles sorting internally now
                loading={loading}
                onCreate={() => setIsCreateOpen(true)}
                onDelete={handleDelete}
                onTogglePin={async (id, current) => {
                  try {
                    const res = await fetch(`/api/contexts/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pinned: !current }),
                    });
                    if (res.ok) {
                      fetchContexts(); // Refresh list
                      toast.success(current ? 'Context unpinned' : 'Context pinned');
                    } else {
                      toast.error('Failed to update pin status');
                    }
                  } catch (error) {
                    toast.error('Error updating pin status');
                  }
                }}
              />
            </div>

            {/* 5. Recent Activity Feed */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
              <ActivityFeed />
            </div>

          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="space-y-6">

            {/* 6. Daily Refresher */}
            <div className="h-[300px]">
              <MiniRecallWidget />
            </div>

            {/* 6.2 Recall Stats */}
            <div className="h-[220px]">
              <RecallStatsCard />
            </div>

            {/* 6.5 Implicit Memory */}
            <div className="h-[200px]">
              <ImplicitMemoryWidget />
            </div>

            {/* 7. System Intelligence */}
            <SystemStats queues={stats?.queues} />

            {/* 7.5 Knowledge Radar */}
            <KnowledgeRadar />

            {/* 8. Tools & Agents */}
            <ToolsPanel />

          </div>
        </div>

      </main>

      {/* 10. Footer */}
      <footer className="border-t py-6 bg-muted/20">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Lumen v0.3-alpha</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <a href="#" className="hover:text-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Report Issue</a>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <a href="#" className="hover:text-foreground flex items-center gap-1"><Book className="w-3 h-3" /> Documentation</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="#" className="hover:text-foreground"><Github className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>

      {/* Create Context Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Context</DialogTitle>
            <DialogDescription>
              Create a new workspace for your memories and agents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newContext.name}
                onChange={(e) => setNewContext({ ...newContext, name: e.target.value })}
                placeholder="e.g. Project Alpha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newContext.description}
                onChange={(e) => setNewContext({ ...newContext, description: e.target.value })}
                placeholder="What is this workspace for?"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!contextToDelete} onOpenChange={(open) => !open && setContextToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{contextToDelete?.name}</strong>? This action cannot be undone and will remove all associated memories.
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
