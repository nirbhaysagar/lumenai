'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, FileText, X, ArrowRight, Loader2, File as FileIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface UnifiedDropZoneProps {
    onIngest: (type: 'file' | 'url' | 'text', content: any) => void;
    isProcessing: boolean;
}

export function UnifiedDropZone({ onIngest, isProcessing }: UnifiedDropZoneProps) {
    const [mode, setMode] = useState<'drop' | 'url' | 'text'>('drop');
    const [urlInput, setUrlInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onIngest('file', acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: mode !== 'drop',
        noKeyboard: true,
        disabled: isProcessing,
        accept: {
            'image/*': [],
            'application/pdf': [],
            'text/*': [],
            'audio/*': [],
            'video/*': []
        }
    });

    useEffect(() => {
        setDragActive(isDragActive);
    }, [isDragActive]);

    // Global paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (isProcessing) return;
            const text = e.clipboardData?.getData('text');
            if (text) {
                if (text.startsWith('http')) {
                    setMode('url');
                    setUrlInput(text);
                } else if (text.length > 100) { // Assume long text is content
                    setMode('text');
                    setTextInput(text);
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isProcessing]);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput) onIngest('url', urlInput);
    };

    const handleTextSubmit = () => {
        if (textInput) onIngest('text', textInput);
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative">
            <div
                {...getRootProps()}
                className={cn(
                    "relative rounded-3xl border-2 border-dashed transition-all duration-300 min-h-[400px] flex flex-col items-center justify-center p-8 overflow-hidden bg-background/50 backdrop-blur-sm",
                    dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20 hover:border-primary/50",
                    isProcessing && "opacity-50 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />

                {/* Background Animation */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20 pointer-events-none">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-[500px] h-[500px] border border-dashed border-primary rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[350px] h-[350px] border border-dotted border-primary/50 rounded-full"
                    />
                </div>

                <AnimatePresence mode="wait">
                    {mode === 'drop' && (
                        <motion.div
                            key="drop"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center space-y-6"
                        >
                            <div className="p-6 bg-primary/10 rounded-full ring-8 ring-primary/5">
                                <Upload className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold tracking-tight">Drop Data Here</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    Drag files, paste URLs, or type notes directly.
                                    The system will auto-detect the format.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" onClick={(e) => { e.stopPropagation(); setMode('url'); }}>
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Link
                                </Button>
                                <Button variant="outline" onClick={(e) => { e.stopPropagation(); setMode('text'); }}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Note
                                </Button>
                                <Button variant="outline" onClick={(e) => {
                                    e.stopPropagation();
                                    (document.querySelector('input[type="file"]') as HTMLInputElement)?.click(); // Trigger hidden input
                                }}>
                                    <FileIcon className="w-4 h-4 mr-2" />
                                    File
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {mode === 'url' && (
                        <motion.div
                            key="url"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-primary" />
                                    Add Link
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setMode('drop')}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <form onSubmit={handleUrlSubmit} className="flex gap-2">
                                <Input
                                    autoFocus
                                    placeholder="https://..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    className="h-12 text-lg"
                                />
                                <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {mode === 'text' && (
                        <motion.div
                            key="text"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Quick Note
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setMode('drop')}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <Textarea
                                autoFocus
                                placeholder="Type your thoughts..."
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className="min-h-[200px] text-base resize-none"
                            />
                            <Button onClick={handleTextSubmit} className="w-full">
                                Ingest Note
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
