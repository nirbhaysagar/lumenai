'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Task {
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    created_at: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const userId = DEMO_USER_ID;

    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('lumen-tasks-guide-dismissed');
        if (!dismissed) {
            setShowGuide(true);
        }
        fetchTasks();
    }, [filter]);

    const dismissGuide = () => {
        localStorage.setItem('lumen-tasks-guide-dismissed', 'true');
        setShowGuide(false);
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ userId });
            if (filter !== 'all') {
                params.append('status', filter);
            }

            const res = await fetch(`/api/tasks?${params}`);
            const data = await res.json();
            if (data.tasks) {
                setTasks(data.tasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, status: newStatus }),
            });

            if (res.ok) {
                toast.success('Task updated');
                fetchTasks();
            } else {
                toast.error('Failed to update task');
            }
        } catch (error) {
            toast.error('Error updating task');
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const res = await fetch(`/api/tasks?taskId=${taskId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Task deleted');
                fetchTasks();
            } else {
                toast.error('Failed to delete task');
            }
        } catch (error) {
            toast.error('Error deleting task');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
            default: return <Circle className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const groupedTasks = {
        pending: tasks.filter(t => t.status === 'pending'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        completed: tasks.filter(t => t.status === 'completed'),
    };

    return (
        <div className="container mx-auto py-8 max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-extracted action items from your conversations
                    </p>
                </div>
                <Button variant="outline" onClick={fetchTasks} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                        className="capitalize"
                    >
                        {status.replace('_', ' ')}
                    </Button>
                ))}
            </div>

            {loading && tasks.length === 0 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : tasks.length === 0 ? (
                showGuide ? (
                    <Card className="border-dashed border-2 bg-muted/5">
                        <CardContent className="flex flex-col items-center text-center py-12 space-y-6">
                            <div className="p-4 rounded-full bg-primary/10 mb-2">
                                <CheckCircle2 className="w-12 h-12 text-primary" />
                            </div>
                            <div className="space-y-2 max-w-lg">
                                <h3 className="text-xl font-semibold">Welcome to AI Tasks</h3>
                                <p className="text-muted-foreground">
                                    Lumen automatically extracts action items from your conversations and documents.
                                    No need to manually type to-do lists anymore.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4 text-left">
                                    <div className="p-3 rounded-lg bg-background border">
                                        <span className="font-medium block mb-1">1. Chat</span>
                                        <span className="text-muted-foreground text-xs">"Remind me to email John"</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border">
                                        <span className="font-medium block mb-1">2. Extract</span>
                                        <span className="text-muted-foreground text-xs">AI identifies the task automatically</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border">
                                        <span className="font-medium block mb-1">3. Track</span>
                                        <span className="text-muted-foreground text-xs">Manage status here</span>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={dismissGuide} size="lg" className="mt-4">
                                Got it, thanks!
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <h3 className="text-lg font-medium">No tasks found</h3>
                        <p className="text-muted-foreground mt-1">
                            Start chatting and the AI will automatically extract action items for you.
                        </p>
                    </div>
                )
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Pending */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Pending ({groupedTasks.pending.length})
                        </h3>
                        {groupedTasks.pending.map((task) => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        {getStatusIcon(task.status)}
                                        <p className="text-sm flex-1">{task.content}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => deleteTask(task.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getPriorityColor(task.priority)} className="text-[10px]">
                                            {task.priority}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-7 text-xs"
                                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                    >
                                        Start
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* In Progress */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            In Progress ({groupedTasks.in_progress.length})
                        </h3>
                        {groupedTasks.in_progress.map((task) => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow border-yellow-200">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        {getStatusIcon(task.status)}
                                        <p className="text-sm flex-1">{task.content}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => deleteTask(task.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getPriorityColor(task.priority)} className="text-[10px]">
                                            {task.priority}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="w-full h-7 text-xs"
                                        onClick={() => updateTaskStatus(task.id, 'completed')}
                                    >
                                        Complete
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Completed */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Completed ({groupedTasks.completed.length})
                        </h3>
                        {groupedTasks.completed.map((task) => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow border-green-200 opacity-75">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        {getStatusIcon(task.status)}
                                        <p className="text-sm flex-1 line-through text-muted-foreground">{task.content}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => deleteTask(task.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getPriorityColor(task.priority)} className="text-[10px]">
                                            {task.priority}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
