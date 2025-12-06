'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Play, Pause, Trash2, Activity, Server, Database, Brain, FileText, ListTodo, Network, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AgentStat {
    id: string;
    name: string;
    status: 'working' | 'idle' | 'paused';
    counts: {
        active: number;
        waiting: number;
        completed: number;
        failed: number;
    };
}

export function AgentsHub() {
    const [agents, setAgents] = useState<AgentStat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/agents/status');
            const data = await res.json();
            if (data.agents) {
                setAgents(data.agents);
            }
        } catch (error) {
            console.error('Failed to fetch agent stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (agentId: string, action: 'pause' | 'resume' | 'clean') => {
        try {
            const res = await fetch('/api/agents/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, action })
            });
            if (res.ok) {
                toast.success(`Agent ${action}d successfully`);
                fetchStats();
            } else {
                toast.error('Action failed');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'embeddings': return <Database className="w-5 h-5 text-blue-400" />;
            case 'topicer': return <Brain className="w-5 h-5 text-purple-400" />;
            case 'dedup': return <Server className="w-5 h-5 text-orange-400" />;
            case 'summarizer': return <FileText className="w-5 h-5 text-green-400" />;
            case 'task_extractor': return <ListTodo className="w-5 h-5 text-yellow-400" />;
            case 'graph': return <Network className="w-5 h-5 text-pink-400" />;
            case 'recall': return <RefreshCw className="w-5 h-5 text-cyan-400" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    return (
        <div className="p-6 space-y-6 h-full overflow-y-auto bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Agents Hub</h1>
                    <p className="text-muted-foreground">Monitor and control your autonomous workers.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchStats}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                    <Card key={agent.id} className="relative overflow-hidden border-white/10 bg-black/20">
                        {/* Status Indicator Line */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${agent.status === 'working' ? 'bg-green-500 animate-pulse' :
                                agent.status === 'paused' ? 'bg-yellow-500' : 'bg-muted'
                            }`} />

                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                        {getIcon(agent.id)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{agent.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 capitalize ${agent.status === 'working' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                                                    agent.status === 'paused' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                                                        'text-muted-foreground'
                                                }`}>
                                                {agent.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                                <div className="p-2 bg-white/5 rounded border border-white/5">
                                    <div className="text-lg font-bold text-green-400">{agent.counts.active}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Active</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded border border-white/5">
                                    <div className="text-lg font-bold text-yellow-400">{agent.counts.waiting}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Queued</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded border border-white/5">
                                    <div className="text-lg font-bold text-blue-400">{agent.counts.completed}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Done</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded border border-white/5">
                                    <div className="text-lg font-bold text-red-400">{agent.counts.failed}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">Fail</div>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end border-t border-white/5 pt-3">
                                {agent.status === 'paused' ? (
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction(agent.id, 'resume')}>
                                        <Play className="w-3 h-3 mr-1" /> Resume
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction(agent.id, 'pause')}>
                                        <Pause className="w-3 h-3 mr-1" /> Pause
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-red-400 hover:bg-red-400/10" onClick={() => handleAction(agent.id, 'clean')}>
                                    <Trash2 className="w-3 h-3 mr-1" /> Clean
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
