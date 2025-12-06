import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getSourceIcon, getSourceTypeName, getSourceTypeColor } from '@/lib/sourceUtils';
import { cn } from '@/lib/utils';

interface SourceModalProps {
    open: boolean;
    onClose: () => void;
    source: any;
    onUseInChat: (text: string) => void;
}

export function SourceModal({ open, onClose, source, onUseInChat }: SourceModalProps) {
    if (!source) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(source.snippet || '');
        toast.success('Copied to clipboard');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {(() => {
                            const Icon = getSourceIcon(source.sourceType || source.metadata?.type || 'text');
                            const typeName = getSourceTypeName(source.sourceType || source.metadata?.type || 'text');
                            const colorClass = getSourceTypeColor(source.sourceType || 'text');

                            return (
                                <>
                                    <Icon className={cn("w-5 h-5 shrink-0", colorClass)} />
                                    <span>{source.title || source.metadata?.title || 'Untitled Source'}</span>
                                    <Badge variant="secondary" className="ml-auto">
                                        {typeName}
                                    </Badge>
                                    {source.score && (
                                        <Badge variant="outline">
                                            {(source.score * 100).toFixed(0)}% match
                                        </Badge>
                                    )}
                                </>
                            );
                        })()}
                    </DialogTitle>
                    <DialogDescription className="space-y-1">
                        {source.sourceType === 'pdf' && source.pdfPage && (
                            <div>📄 Page {source.pdfPage}</div>
                        )}
                        {source.sourceType === 'url' && source.url && (
                            <div className="flex items-center gap-2">
                                🌐 <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                    {source.url}
                                </a>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {new Date(source.metadata?.created_at || Date.now()).toLocaleDateString()} • Capture {source.captureId?.slice(0, 8)}...
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/50">
                    <div className="whitespace-pre-wrap font-mono text-sm">
                        {source.snippet}
                    </div>
                </ScrollArea>

                <div className="flex flex-wrap gap-2 mt-2">
                    {source.metadata?.topics?.map((topic: string) => (
                        <Badge key={topic} variant="secondary">{topic}</Badge>
                    ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Text
                    </Button>
                    <Button onClick={() => {
                        onUseInChat(source.snippet);
                        onClose();
                    }}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Use in Chat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
