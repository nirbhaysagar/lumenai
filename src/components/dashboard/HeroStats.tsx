import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Database, Layers, Zap } from 'lucide-react';

interface HeroStatsProps {
    stats: {
        activeContexts: number;
        queuedJobs: number;
        memoryCounts: {
            raw: number;
            canonical: number;
            abstract: number;
        };
        systemHealth: string;
    } | null;
    loading: boolean;
}

export function HeroStats({ stats, loading }: HeroStatsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-4 w-4 bg-muted rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-12 bg-muted rounded mb-2" />
                            <div className="h-3 w-32 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Contexts</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeContexts}</div>
                    <p className="text-xs text-muted-foreground">
                        Workspaces for your thoughts
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.memoryCounts.raw + stats.memoryCounts.canonical + stats.memoryCounts.abstract}
                    </div>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {stats.memoryCounts.raw} Raw
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {stats.memoryCounts.canonical} Clean
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            {stats.memoryCounts.abstract} Graph
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{stats.systemHealth}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.queuedJobs} jobs in background queue
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
