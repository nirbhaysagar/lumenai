'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, FileText, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';

interface DocumentEditorProps {
    contextId: string;
    initialContent?: string;
    captureId?: string | null;
    onSave?: () => void;
}

export function DocumentEditor({ contextId, initialContent = '', captureId, onSave }: DocumentEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        const toastId = toast.loading('Saving capture...');

        try {
            const url = '/api/captures';
            const method = captureId ? 'PATCH' : 'POST';
            const body = captureId
                ? { id: captureId, raw_text: content }
                : {
                    type: 'text',
                    raw_text: content,
                    title: 'Context Draft',
                    user_id: DEMO_USER_ID, // Hardcoded
                    context_id: contextId,
                    visible_in_rag: true,
                };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save');
            }

            toast.success('Draft saved to memory', { id: toastId });
            if (onSave) onSave();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(`Failed to save: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Editor Toolbar */}
            <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-muted/5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>Drafting Mode</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 gap-2">
                        <Sparkles className="w-3 h-3" />
                        Auto-Complete
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="w-3 h-3" />
                        {isSaving ? 'Saving...' : 'Save as Capture'}
                    </Button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto">
                    <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Start typing... Use '@' to link to memories, '[[' for wiki-links."
                        />
                    </div>
                </div>

                {/* Right Sidebar: Live RAG (Placeholder) */}
                <div className="w-64 border-l border-border/40 bg-muted/5 p-4 hidden xl:block">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                        Suggested Citations
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-muted-foreground">
                            Start typing to see relevant memories appear here...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
