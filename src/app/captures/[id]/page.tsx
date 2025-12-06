'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowLeft, FileText, Link as LinkIcon, Calendar, Layers, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ChatClient from '@/components/chat/ChatClient';
import { MemoryIntentModal } from '@/components/memory/MemoryIntentModal';
import { Zap } from 'lucide-react';

export default function CaptureDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [capture, setCapture] = useState<any>(null);
    const [chunks, setChunks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChunks, setSelectedChunks] = useState<Set<string>>(new Set());

    const [contexts, setContexts] = useState<any[]>([]);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedContextId, setSelectedContextId] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (id) fetchCaptureDetails();
        fetchContexts();
    }, [id]);

    const fetchContexts = async () => {
        try {
            const res = await fetch(`/api/contexts?userId=${DEMO_USER_ID}`);
            const data = await res.json();
            if (data.contexts) setContexts(data.contexts);
        } catch (error) {
            console.error('Failed to fetch contexts', error);
        }
    };

    const fetchCaptureDetails = async () => {
        try {
            const res = await fetch(`/api/captures/${id}`);
            const data = await res.json();
            if (data.capture) {
                setCapture(data.capture);
                setChunks(data.chunks || []);
            } else {
                toast.error('Capture not found');
            }
        } catch (error) {
            console.error('Failed to fetch capture details', error);
            toast.error('Failed to load capture details');
        } finally {
            setLoading(false);
        }
    };

    const toggleChunkSelection = (chunkId: string) => {
        const newSelected = new Set(selectedChunks);
        if (newSelected.has(chunkId)) {
            newSelected.delete(chunkId);
        } else {
            newSelected.add(chunkId);
        }
        setSelectedChunks(newSelected);
    };

    const handleAssignToContext = async () => {
        if (!selectedContextId) return;
        setAssigning(true);
        try {
            const res = await fetch('/api/contexts/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contextId: selectedContextId,
                    chunkIds: Array.from(selectedChunks)
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Assigned ${selectedChunks.size} chunks to context`);
                setIsAssignOpen(false);
                setSelectedChunks(new Set());
            } else {
                toast.error('Failed to assign chunks');
            }
        } catch (error) {
            toast.error('Error assigning chunks');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!capture) {
        return (
            <div className="container mx-auto py-8 text-center">
                <h1 className="text-2xl font-bold">Capture not found</h1>
                <Link href="/captures" className="mt-4 inline-block">
                    <Button>Back to Captures</Button>
                </Link>
            </div>
        );
    }

    const hasSourceView = capture.source_url && (
        capture.type === 'pdf' ||
        capture.type === 'image' ||
        capture.type === 'audio' ||
        capture.type === 'video' ||
        capture.type === 'document'
    );

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between bg-background z-10">
                <div className="flex items-center gap-4">
                    <Link href="/captures" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight truncate max-w-md">{capture.title || 'Untitled Capture'}</h1>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize">{capture.type}</Badge>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(capture.created_at).toLocaleDateString()}
                            </span>
                            {capture.source_url && (
                                <a href={capture.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline text-blue-500">
                                    <ExternalLink className="w-3 h-3" />
                                    Open Source
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <MemoryIntentModal targetId={id} targetType="capture">
                        <Button variant="outline" size="sm">
                            <Zap className="w-4 h-4 mr-2" />
                            Memory
                        </Button>
                    </MemoryIntentModal>
                    <Button variant="outline" size="sm" disabled={selectedChunks.size === 0} onClick={() => setIsAssignOpen(true)}>
                        <Layers className="w-4 h-4 mr-2" />
                        Assign ({selectedChunks.size})
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {hasSourceView ? (
                    <ResizablePanelGroup direction="horizontal" className="border-t">
                        {/* Left Panel: Source View */}
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full bg-muted/20 p-4 overflow-hidden flex flex-col">
                                <div className="flex-1 border rounded-lg overflow-hidden bg-white relative">
                                    {capture.type === 'pdf' ? (
                                        <embed
                                            src={`${capture.source_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                            type="application/pdf"
                                            className="w-full h-full"
                                        />
                                    ) : capture.type === 'image' ? (
                                        <div className="w-full h-full flex items-center justify-center overflow-auto">
                                            <img
                                                src={capture.source_url}
                                                alt="Source"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        </div>
                                    ) : capture.type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                            <video
                                                src={capture.source_url}
                                                controls
                                                className="max-w-full max-h-full"
                                            />
                                        </div>
                                    ) : capture.type === 'audio' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <audio
                                                src={capture.source_url}
                                                controls
                                                className="w-full max-w-md"
                                            />
                                        </div>
                                    ) : (
                                        // Document or other types
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-4">
                                            <FileText className="w-16 h-16 text-muted-foreground" />
                                            <p className="text-muted-foreground">Preview not available for this file type.</p>
                                            <Button asChild variant="outline">
                                                <a href={capture.source_url} target="_blank" rel="noopener noreferrer">
                                                    Download File
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Right Panel: Chunks */}
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b bg-background">
                                    <h2 className="text-lg font-semibold">Chat with Document</h2>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ChatClient
                                        contextId="default"
                                        captureId={id}
                                        userId={DEMO_USER_ID} // Hardcoded for now
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    // Fallback for non-visual content (Text/URL without screenshot)
                    <ScrollArea className="h-full">
                        <div className="container max-w-4xl mx-auto p-6 space-y-6">
                            <div className="grid gap-4">
                                {chunks.map((chunk, index) => (
                                    <Card key={chunk.id} className={selectedChunks.has(chunk.id) ? 'border-primary' : ''}>
                                        <CardHeader className="flex flex-row items-start space-y-0 pb-2 gap-4">
                                            <Checkbox
                                                checked={selectedChunks.has(chunk.id)}
                                                onCheckedChange={() => toggleChunkSelection(chunk.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                                        Chunk #{index + 1}
                                                    </CardTitle>
                                                    <div className="flex gap-2">
                                                        {chunk.metadata?.topics?.map((topic: string) => (
                                                            <Badge key={topic} variant="secondary" className="text-xs">
                                                                {topic}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap mt-2">
                                                    {chunk.content}
                                                </p>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Assignment Modal */}
            {isAssignOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Assign to Context</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Context</label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={selectedContextId}
                                    onChange={(e) => setSelectedContextId(e.target.value)}
                                >
                                    <option value="">Select a context...</option>
                                    {contexts.map(ctx => (
                                        <option key={ctx.id} value={ctx.id}>{ctx.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                                <Button onClick={handleAssignToContext} disabled={!selectedContextId || assigning}>
                                    {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Assign
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
