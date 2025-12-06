import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface MarkForRecallModalProps {
    isOpen: boolean;
    onClose: () => void;
    chunk?: any; // Optional chunk being marked
    memory?: any; // Optional memory being marked
    userId: string;
}

export function MarkForRecallModal({ isOpen, onClose, chunk, memory, userId }: MarkForRecallModalProps) {
    const [question, setQuestion] = useState('');
    const [note, setNote] = useState('');
    const [delay, setDelay] = useState('1');
    const [loading, setLoading] = useState(false);

    // Get content based on whether it's a chunk or memory
    const sourceContent = chunk?.content || (typeof memory?.content === 'string'
        ? (memory.content.startsWith('{') ? JSON.parse(memory.content).summary : memory.content)
        : memory?.content?.summary || 'No content');

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const requestBody: any = {
                userId,
                content: question || sourceContent.slice(0, 100) + '...',
                note,
                delayDays: parseInt(delay)
            };

            // Add either chunkId or memoryId based on source
            if (chunk?.id) {
                requestBody.chunkId = chunk.id;
            } else if (memory?.id) {
                requestBody.memoryId = memory.id;
            }

            const res = await fetch('/api/recall/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Added to Active Recall');
                onClose();
                setQuestion('');
                setNote('');
                setDelay('1');
            } else {
                toast.error('Failed to add item');
            }
        } catch (error) {
            toast.error('Error creating recall item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mark for Recall</DialogTitle>
                    <DialogDescription>
                        Turn this memory into a flashcard for spaced repetition.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground italic border">
                        "{sourceContent.slice(0, 150)}..."
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="question">Question / Concept</Label>
                        <Input
                            id="question"
                            placeholder="e.g. What is the key takeaway?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="note">Private Note (Optional)</Label>
                        <Textarea
                            id="note"
                            placeholder="Add context for your future self..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>First Review In</Label>
                        <Select value={delay} onValueChange={setDelay}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select delay" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Day (Tomorrow)</SelectItem>
                                <SelectItem value="3">3 Days</SelectItem>
                                <SelectItem value="7">1 Week</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Add to Deck
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
