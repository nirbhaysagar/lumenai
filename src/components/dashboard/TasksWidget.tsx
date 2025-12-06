'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ListTodo, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Task {
    id: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    status: string;
}

export function TasksWidget() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = DEMO_USER_ID;

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch(`/api/tasks?userId=${userId}&status=pending`);
                const data = await res.json();
                if (data.tasks) {
                    setTasks(data.tasks.slice(0, 5)); // Top 5
                }
            } catch (error) {
                console.error('Failed to fetch tasks', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const markComplete = async (taskId: string) => {
        try {
            await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, status: 'completed' }),
            });
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Failed to update task', error);
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

    return (
        <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    Pending Tasks
                </CardTitle>
                <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View All
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No pending tasks
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => markComplete(task.id)}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm line-clamp-2">{task.content}</p>
                                    <Badge variant={getPriorityColor(task.priority)} className="mt-1 text-[10px] h-4">
                                        {task.priority}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
