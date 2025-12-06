'use client';

import { useState } from 'react';
import { DEMO_USER_ID } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Hash, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryIntentModalProps {
    targetId: string;
    targetType: 'capture' | 'chunk' | 'summary';
    trigger?: React.ReactNode;
    children?: React.ReactNode;
}

export function MemoryIntentModal({ targetId, targetType, trigger, children }: MemoryIntentModalProps) {
    const [open, setOpen] = useState(false);
    const [triggerType, setTriggerType] = useState<'time' | 'topic'>('time');
    const [date, setDate] = useState<Date>();
    const [topic, setTopic] = useState('');
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (triggerType === 'time' && !date) {
            toast.error('Please select a date');
            return;
        }
        if (triggerType === 'topic' && !topic) {
            toast.error('Please enter a topic');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/memory/directives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: DEMO_USER_ID, // Hardcoded for MVP
                    targetType,
                    targetId,
                    triggerType,
                    triggerValue: triggerType === 'time' ? date?.toISOString() : topic,
                    priority,
                    action: 'surface',
                }),
            });

            if (!res.ok) throw new Error('Failed to create directive');

            toast.success('Memory intent set successfully!');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to set memory intent');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || trigger || <Button variant="outline" size="sm"><Zap className="w-4 h-4 mr-2" /> Remember This</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Memory Intent</DialogTitle>
                    <DialogDescription>
                        Tell Lumen when to surface this memory.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="time" onValueChange={(v) => setTriggerType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="time">
                            <Clock className="w-4 h-4 mr-2" /> Time Trigger
                        </TabsTrigger>
                        <TabsTrigger value="topic">
                            <Hash className="w-4 h-4 mr-2" /> Topic Trigger
                        </TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4">
                        <TabsContent value="time" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Remind me on</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </TabsContent>

                        <TabsContent value="topic" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Surface when reading about</Label>
                                <Input
                                    placeholder="e.g. Startup Ideas, React, Cooking"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>
                        </TabsContent>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low (Subtle)</SelectItem>
                                    <SelectItem value="medium">Medium (Normal)</SelectItem>
                                    <SelectItem value="high">High (Important)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Set Intent'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
