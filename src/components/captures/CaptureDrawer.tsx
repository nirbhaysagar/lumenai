'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Link as LinkIcon, Calendar, HardDrive, RefreshCw, FolderInput, Trash2, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface CaptureDrawerProps {
    capture: any;
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string, capture: any) => void;
}

export function CaptureDrawer({ capture, isOpen, onClose, onAction }: CaptureDrawerProps) {
    const [showFull, setShowFull] = useState(false);

    if (!capture) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
            <SheetContent className="w-[400px] sm:w-[600px] flex flex-col gap-0 p-0 shadow-2xl border-l" hideOverlay={true}>
                <SheetHeader className="p-6 border-b border-border/40 bg-muted/5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-background border border-border shadow-sm">
                            {capture.type === 'url' ? <LinkIcon className="w-6 h-6 text-blue-500" /> : <FileText className="w-6 h-6 text-primary" />}
                        </div>
                        <div className="space-y-1 flex-1">
                            <SheetTitle className="text-lg font-semibold leading-tight">
                                {capture.title || 'Untitled Capture'}
                            </SheetTitle>
                            <SheetDescription className="flex items-center gap-2 text-xs">
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 capitalize">
                                    {capture.type}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(capture.created_at), 'PPP p')}
                                </span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* Content Preview */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Content</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setShowFull(!showFull)}
                                >
                                    {showFull ? (
                                        <>
                                            <Minimize2 className="w-3 h-3 mr-1" />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 className="w-3 h-3 mr-1" />
                                            Show Full
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className={`p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed font-mono whitespace-pre-wrap ${showFull ? '' : 'max-h-[400px] overflow-y-auto'}`}>
                                {capture.raw_text ? (
                                    showFull ? capture.raw_text : (
                                        capture.raw_text.slice(0, 2000) + (capture.raw_text.length > 2000 ? '...' : '')
                                    )
                                ) : (
                                    <span className="text-muted-foreground italic">No text content extracted.</span>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Original Source</label>
                                <div className="flex items-center gap-2">
                                    {capture.metadata?.url ? (
                                        <a href={capture.metadata.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                            Open Link <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-sm">Uploaded File</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Size</label>
                                <p className="text-sm font-mono">{capture.raw_text?.length || 0} chars</p>
                            </div>
                        </div>

                        {/* Processing Status */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Processing</h3>
                            <div className="p-3 rounded-lg border border-border/50 bg-background space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant="outline" className="capitalize">{capture.status}</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Chunks</span>
                                    <span>{capture.chunk_count || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Dedup Score</span>
                                    <span>{capture.metadata?.dedup_score || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-6 border-t border-border/40 bg-muted/5 flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => onAction('summarize', capture)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Summarize
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => onAction('assign', capture)}>
                        <FolderInput className="w-4 h-4 mr-2" />
                        Assign Context
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onAction('delete', capture)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
