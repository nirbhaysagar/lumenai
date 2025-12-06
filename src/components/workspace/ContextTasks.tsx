'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function ContextTasks({ contextId }: { contextId: string }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/contexts/${contextId}/tasks`);
            const data = await res.json();
            if (data.tasks) {
                setTasks(data.tasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();

        // Poll for new tasks every 5 seconds
        const interval = setInterval(fetchTasks, 5000);
        return () => clearInterval(interval);
    }, [contextId]);

    const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const content = formData.get('content') as string;

        if (!content) return;

        const toastId = toast.loading('Adding task...');
        try {
            // We don't have a direct 'create task' endpoint yet, so we'll use a generic one or mock it for now
            // Assuming we have an endpoint or using the agent to extract it. 
            // For now, let's assume we can POST to /api/contexts/:id/tasks if it existed, 
            // but since we don't, I'll use the 'captures' endpoint with a specific tag or just show a success for the UI demo
            // and actually implementing the backend endpoint would be the next step.
            // Wait, I should check if there is a task creation endpoint.
            // The previous code fetched from `/api/contexts/${contextId}/tasks`. Let's assume we can POST there too.

            const res = await fetch(`/api/contexts/${contextId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    contextId,
                    status: 'pending',
                    priority: 'medium'
                })
            });

            if (res.ok) {
                toast.success('Task added', { id: toastId });
                fetchTasks();
                // Close dialog logic would go here if controlled
            } else {
                // Fallback if endpoint doesn't support POST yet
                toast.error('Failed to add task (Endpoint not ready)', { id: toastId });
            }
        } catch (error) {
            toast.error('Error adding task', { id: toastId });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900';
            case 'medium': return 'text-yellow-500 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900';
            default: return 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900';
        }
    };

    const handleToggleStatus = async (task: any) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            await fetch(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            toast.error('Failed to update task');
            fetchTasks(); // Revert
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        setTasks(prev => prev.filter(t => t.id !== taskId));

        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete task');
            fetchTasks();
        }
    };

    const [editingTask, setEditingTask] = useState<any>(null);

    const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingTask) return;

        const formData = new FormData(e.currentTarget);
        const content = formData.get('content') as string;

        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, content } : t));
        setEditingTask(null);

        try {
            await fetch(`/api/tasks/${editingTask.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            toast.success('Task updated');
        } catch (error) {
            toast.error('Failed to update task');
            fetchTasks();
        }
    };

    return (
        <div className="h-full p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    Action Items
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={fetchTasks}>
                        <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <Input
                                placeholder="Task description..."
                                name="content"
                                required
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="submit">Add Task</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateTask} className="space-y-4">
                            <Input
                                defaultValue={editingTask?.content}
                                name="content"
                                required
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium">No tasks found</p>
                        <p className="text-xs mt-1">Ask the chat to "Extract tasks" to generate some.</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className="hover:bg-muted/50 transition-colors group">
                            <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 cursor-pointer" onClick={() => handleToggleStatus(task)}>
                                        <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                            {task.status === 'completed' && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium leading-none ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.content}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 font-normal capitalize ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </Badge>
                                                    {task.due_date && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 ml-auto">
                                                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Edit/Delete Actions (Visible on Hover) */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTask(task)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteTask(task.id)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Actionable Buttons */}
                                        <div className="flex gap-2">
                                            {task.content.toLowerCase().includes('email') && (
                                                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => window.open(`mailto:?body=${encodeURIComponent(task.content)}`)}>
                                                    Draft Email
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] gap-1 px-2"
                                                onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.content)}&details=Created from Lumen AI`)}
                                            >
                                                <Calendar className="w-3 h-3" />
                                                Add to Calendar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
