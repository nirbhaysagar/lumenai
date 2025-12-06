'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Link as LinkIcon, FileText, Mic, X, Image as ImageIcon, Twitter, Youtube, Code, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

interface GlobalCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalCaptureModal({ isOpen, onClose }: GlobalCaptureModalProps) {
    const [activeTab, setActiveTab] = useState('write');
    const [loading, setLoading] = useState(false);

    // Form States
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [ocrEnabled, setOcrEnabled] = useState(true);

    // Context Selection
    const [contexts, setContexts] = useState<any[]>([]);
    const [selectedContext, setSelectedContext] = useState<string>('none');

    // Detected Types
    const [linkType, setLinkType] = useState<'url' | 'tweet' | 'youtube'>('url');
    const [fileType, setFileType] = useState<'file' | 'image' | 'audio'>('file');

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setText('');
            setUrl('');
            setFile(null);
            setLoading(false);
            setLinkType('url');
            setFileType('file');
            setSelectedContext('none');
        }
    }, [isOpen]);

    // Fetch contexts
    useEffect(() => {
        const fetchContexts = async () => {
            try {
                const res = await fetch(`/api/contexts?userId=${DEMO_USER_ID}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setContexts(data);
                }
            } catch (error) {
                console.error('Failed to fetch contexts', error);
            }
        };
        if (isOpen) {
            fetchContexts();
        }
    }, [isOpen]);

    // Auto-detect link type
    useEffect(() => {
        if (!url) {
            setLinkType('url');
            return;
        }
        if (url.includes('twitter.com') || url.includes('x.com')) {
            setLinkType('tweet');
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            setLinkType('youtube');
        } else {
            setLinkType('url');
        }
    }, [url]);

    // Auto-detect file type
    useEffect(() => {
        if (!file) return;
        if (file.type.startsWith('image/')) {
            setFileType('image');
        } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            setFileType('audio');
        } else {
            setFileType('file');
        }
    }, [file]);

    const handleIngest = async () => {
        setLoading(true);
        const formData = new FormData();
        const userId = DEMO_USER_ID; // Hardcoded
        formData.append('userId', userId);

        if (selectedContext && selectedContext !== 'none') {
            formData.append('contextId', selectedContext);
        }

        try {
            if (activeTab === 'upload' && file) {
                formData.append('file', file);

                // Determine accurate type
                let type = 'document'; // Default to document for text/code/etc
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('audio/')) type = 'audio';
                else if (file.type.startsWith('video/')) type = 'video';
                else if (file.type === 'application/pdf') type = 'pdf';
                else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) type = 'document';

                formData.append('type', type);
                if (type === 'image') formData.append('ocr', ocrEnabled.toString());
            } else if (activeTab === 'link' && url) {
                formData.append('url', url);
                formData.append('type', linkType);
            } else if (activeTab === 'write' && text) {
                formData.append('text', text);
                formData.append('type', 'text'); // Could detect code here
            } else {
                toast.error('Please provide content to ingest');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Content captured! Processing started.');
                onClose();
            } else {
                toast.error(data.error || 'Failed to ingest content');
            }
        } catch (error) {
            console.error('Ingest error:', error);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const getLinkInfo = () => {
        switch (linkType) {
            case 'tweet':
                return { icon: <Twitter className="w-4 h-4 text-blue-400" />, text: 'Tweet', time: '~5s', desc: 'Extracts author, date, and thread content.' };
            case 'youtube':
                return { icon: <Youtube className="w-4 h-4 text-red-500" />, text: 'YouTube', time: '~30s', desc: 'Fetches video transcript and metadata.' };
            default:
                return { icon: <LinkIcon className="w-4 h-4" />, text: 'Web Page', time: '~10s', desc: 'Scrapes and summarizes page content.' };
        }
    };

    const getFileInfo = () => {
        switch (fileType) {
            case 'image':
                return { icon: <ImageIcon className="w-4 h-4 text-purple-500" />, text: 'Image (OCR)', time: '~15s', desc: 'Extracts text from image using OCR.' };
            case 'audio':
                return { icon: <Mic className="w-4 h-4 text-orange-500" />, text: 'Audio/Video', time: '~1m', desc: 'Transcribes speech to text.' };
            default:
                return { icon: <FileText className="w-4 h-4" />, text: 'Document', time: '~5s', desc: 'Parses text and structure from file.' };
        }
    };

    const linkInfo = getLinkInfo();
    const fileInfo = getFileInfo();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Quick Capture</DialogTitle>
                    <DialogDescription>
                        Ingest any content type into your second brain.
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4">
                    <Label className="mb-2 block">Assign to Context (Optional)</Label>
                    <Select value={selectedContext} onValueChange={setSelectedContext}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a context..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Context (Inbox)</SelectItem>
                            {contexts.map(ctx => (
                                <SelectItem key={ctx.id} value={ctx.id}>{ctx.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="write" className="gap-2"><FileText className="w-4 h-4" /> Write</TabsTrigger>
                        <TabsTrigger value="link" className="gap-2"><LinkIcon className="w-4 h-4" /> Link</TabsTrigger>
                        <TabsTrigger value="upload" className="gap-2"><Upload className="w-4 h-4" /> Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="write" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Quick Note / Code</Label>
                            <Textarea
                                placeholder="Paste text, code snippets, or jot down ideas..."
                                className="min-h-[200px] font-mono text-sm"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Code className="w-3 h-3" />
                                <span>Code blocks will be automatically detected.</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                    placeholder="https://twitter.com/..., https://youtube.com/..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>

                            {url && (
                                <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-3 border animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 bg-background rounded-md shadow-sm">
                                        {linkInfo.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{linkInfo.text}</span>
                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                                {linkInfo.time}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {linkInfo.desc}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative group">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept=".pdf,.txt,.md,.docx,.jpg,.png,.mp3,.mp4"
                            />
                            <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                {file ? (
                                    <div className="text-sm font-medium text-primary">
                                        {file.name}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium">Drop file or click to upload</p>
                                        <p className="text-xs text-muted-foreground">PDF, Images, Audio, Video</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {file && (
                            <div className="space-y-4">
                                <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-3 border">
                                    <div className="p-2 bg-background rounded-md shadow-sm">
                                        {fileInfo.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{fileInfo.text}</span>
                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                                {fileInfo.time}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {fileInfo.desc}
                                        </p>
                                    </div>
                                </div>

                                {fileType === 'image' && (
                                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                                        <Label htmlFor="ocr-mode" className="flex flex-col space-y-1">
                                            <span>Run OCR</span>
                                            <span className="font-normal text-xs text-muted-foreground">Extract text from image</span>
                                        </Label>
                                        <Switch id="ocr-mode" checked={ocrEnabled} onCheckedChange={setOcrEnabled} />
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleIngest} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Capture
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
