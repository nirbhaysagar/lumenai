'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Activity, Server, Database, Play, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, configRes] = await Promise.all([
                fetch('/api/admin/queues'),
                fetch('/api/admin/config')
            ]);
            setStats(await statsRes.json());
            setConfig(await configRes.json());
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = async (key: string, value: boolean) => {
        // Optimistic update
        setConfig((prev: any) => ({ ...prev, [key]: value }));

        try {
            await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
            toast.success('Configuration saved');
        } catch (error) {
            toast.error('Failed to save configuration');
            fetchData(); // Revert
        }
    };

    const handleTriggerDedup = async () => {
        setTriggering(true);
        try {
            const res = await fetch('/api/admin/dedup', { method: 'POST' });
            if (res.ok) {
                toast.success('Deduplication job queued');
            } else {
                toast.error('Failed to trigger deduplication');
            }
        } catch (error) {
            toast.error('Error triggering job');
        } finally {
            setTriggering(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Server className="w-8 h-8 text-primary" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        System health, worker queues, and configuration.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        System Operational
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="queues">Queues & Workers</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Math.floor(stats?.systemInfo?.uptime / 3600)}h {Math.floor((stats?.systemInfo?.uptime % 3600) / 60)}m
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Since last restart
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.queues?.reduce((acc: number, q: any) => acc + q.active, 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Across all queues
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">
                                    {stats?.queues?.reduce((acc: number, q: any) => acc + q.failed, 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Requires attention
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Trigger Deduplication</p>
                                        <p className="text-xs text-muted-foreground">
                                            Manually run the canonicalization process.
                                        </p>
                                    </div>
                                    <Button onClick={handleTriggerDedup} disabled={triggering}>
                                        {triggering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        <Play className="w-4 h-4 mr-2" />
                                        Run Now
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="queues" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats?.queues?.map((queue: any) => (
                            <Card key={queue.name}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium capitalize">{queue.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${stats.workers[queue.name.split('-')[0]] === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        {stats.workers[queue.name.split('-')[0]] || 'Unknown'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Active</span>
                                            <span className="font-medium text-blue-500">{queue.active}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Waiting</span>
                                            <span className="font-medium">{queue.waiting}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Failed</span>
                                            <span className="font-medium text-red-500">{queue.failed}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Completed</span>
                                            <span className="font-medium text-green-500">{queue.completed}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Flags</CardTitle>
                            <CardDescription>
                                Toggle system capabilities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="ocr" className="flex flex-col space-y-1">
                                    <span>Enable OCR</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        Extract text from images and PDFs using Tesseract/Vision API.
                                    </span>
                                </Label>
                                <Switch
                                    id="ocr"
                                    checked={config?.enableOCR}
                                    onCheckedChange={(c) => handleConfigChange('enableOCR', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="youtube" className="flex flex-col space-y-1">
                                    <span>Enable YouTube Transcripts</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        Automatically fetch and ingest subtitles from YouTube URLs.
                                    </span>
                                </Label>
                                <Switch
                                    id="youtube"
                                    checked={config?.enableYouTube}
                                    onCheckedChange={(c) => handleConfigChange('enableYouTube', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="local-embed" className="flex flex-col space-y-1">
                                    <span>Local Embeddings</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        Use local ONNX model instead of OpenAI for embeddings (saves cost).
                                    </span>
                                </Label>
                                <Switch
                                    id="local-embed"
                                    checked={config?.enableLocalEmbeddings}
                                    onCheckedChange={(c) => handleConfigChange('enableLocalEmbeddings', c)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
