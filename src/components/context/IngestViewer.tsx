import { useState, useEffect } from 'react';
import { X, FileText, Image as ImageIcon, Link as LinkIcon, Code, Trash2, Edit2, Loader2, Star, History, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';

interface IngestViewerProps {
    chunk: any;
    onClose: () => void;
    onDelete?: (id: string) => void;
    onEdit?: () => void;
    onRefresh?: () => void;
}

export function IngestViewer({ chunk, onClose, onDelete, onEdit, onRefresh }: IngestViewerProps) {
    const [fullContent, setFullContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [versions, setVersions] = useState<any[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);

    useEffect(() => {
        const fetchFullContent = async () => {
            if (chunk?.capture_id) {
                console.log('Fetching full content for capture:', chunk.capture_id);
                setLoading(true);
                try {
                    const res = await fetch(`/api/captures?id=${chunk.capture_id}&userId=demo`);
                    const data = await res.json();
                    console.log('Fetch result:', data);
                    if (data.capture) {
                        setFullContent(data.capture.raw_text || data.capture.content); // Try raw_text first
                        setIsPinned(data.capture.pinned || false);
                    }
                } catch (error) {
                    console.error('Failed to fetch full content', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setFullContent(null);
                setIsPinned(chunk.pinned || chunk.captures?.pinned || false);
            }
        };

        fetchFullContent();
    }, [chunk]);

    const handleTogglePin = async () => {
        const captureId = chunk.capture_id || chunk.id;
        try {
            const res = await fetch('/api/captures', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: captureId, pinned: !isPinned }),
            });

            if (res.ok) {
                setIsPinned(!isPinned);
                toast.success(!isPinned ? 'Pinned item' : 'Unpinned item');
                onRefresh?.();
            } else {
                throw new Error('Failed to update pin');
            }
        } catch (error) {
            toast.error('Failed to update pin status');
        }
    };

    const fetchVersions = async () => {
        const captureId = chunk.capture_id || chunk.id;
        setLoadingVersions(true);
        try {
            const res = await fetch(`/api/captures/${captureId}/versions`);
            const data = await res.json();
            if (data.versions) {
                setVersions(data.versions);
            }
        } catch (error) {
            console.error('Failed to fetch versions', error);
            toast.error('Failed to load history');
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleRestore = async (versionId: string) => {
        const captureId = chunk.capture_id || chunk.id;
        try {
            const res = await fetch(`/api/captures/${captureId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId }),
            });

            if (res.ok) {
                const data = await res.json();
                setFullContent(data.capture.raw_text || data.capture.content);
                toast.success('Version restored');
                setShowHistory(false);
                onRefresh?.();
            } else {
                throw new Error('Failed to restore');
            }
        } catch (error) {
            toast.error('Failed to restore version');
        }
    };

    if (!chunk) return null;

    const type = chunk.metadata?.type || 'text';
    const title = chunk.captures?.title || chunk.metadata?.title || 'Untitled Memory';
    const date = new Date(chunk.created_at).toLocaleString();
    const displayContent = fullContent || chunk.content;

    const getIcon = () => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4" />;
            case 'image': return <ImageIcon className="w-4 h-4" />;
            case 'url': return <LinkIcon className="w-4 h-4" />;
            case 'code': return <Code className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    // Simple heuristic to detect HTML (from Tiptap) vs Markdown
    const isHtml = (text: string) => {
        if (!text) return false;
        const trimmed = text.trim();
        return trimmed.startsWith('<') && (trimmed.endsWith('>') || trimmed.includes('</'));
    };

    return (
        <div className="flex flex-col h-full bg-background border-b border-border/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/10 flex-shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        {getIcon()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-medium truncate">{title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{type.toUpperCase()}</span>
                            <span>•</span>
                            <span>{date}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-[10px] h-5">
                                {fullContent ? 'Full Content' : 'Snippet'}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isPinned ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'}`}
                        onClick={handleTogglePin}
                        title="Pin/Unpin"
                    >
                        <Star className={`w-4 h-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setShowHistory(true);
                            fetchVersions();
                        }}
                        title="History"
                    >
                        <History className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onEdit}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(chunk.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="max-w-3xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading full content...</span>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                            {displayContent && isHtml(displayContent) ? (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(displayContent, {
                                            ADD_ATTR: ['class', 'target'],
                                        })
                                    }}
                                />
                            ) : (
                                <ReactMarkdown>{displayContent || ''}</ReactMarkdown>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Version History</DialogTitle>
                        <DialogDescription>
                            Restore a previous version of this note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {loadingVersions ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : versions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No history available.</p>
                        ) : (
                            versions.map((v) => (
                                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {new Date(v.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {v.content.slice(0, 50)}...
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRestore(v.id)}
                                        className="gap-2"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Restore
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
