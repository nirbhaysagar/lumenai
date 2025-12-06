'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Link as LinkIcon, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlobalCaptureModal } from '@/components/shared/GlobalCaptureModal';

export function QuickCaptureBar() {
    const [input, setInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // If it looks like a URL, treat as link
        // If it looks like a file path (not really possible from input), or just text
        // For now, we'll just open the modal with the text pre-filled or handle simple text ingest directly

        // Let's implement direct text ingest for speed
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('userId', DEMO_USER_ID); // Hardcoded

            if (input.startsWith('http')) {
                formData.append('type', 'url');
                formData.append('url', input);
            } else {
                formData.append('type', 'text');
                formData.append('text', input);
            }

            const res = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Captured to inbox');
                setInput('');
            } else {
                toast.error('Failed to capture');
            }
        } catch (error) {
            toast.error('Error capturing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="w-full max-w-3xl mx-auto relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-background/80 backdrop-blur-xl border rounded-xl shadow-lg p-2 flex items-center gap-2">
                    <div className="flex gap-1 border-r pr-2 mr-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setIsModalOpen(true)} title="Upload File">
                            <Upload className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setIsModalOpen(true)} title="Add Link">
                            <LinkIcon className="w-4 h-4" />
                        </Button>
                    </div>

                    <form onSubmit={handleQuickSubmit} className="flex-1 flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="What do you want to remember or work on today?"
                            className="border-none shadow-none bg-transparent h-10 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
                        />
                        <Button size="icon" disabled={!input.trim() || loading} className="h-9 w-9 shrink-0">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>
                </div>
            </div>

            <GlobalCaptureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
