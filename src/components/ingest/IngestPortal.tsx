'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Upload, Link as LinkIcon, FileText, X, ArrowRight, Loader2, File as FileIcon, Image as ImageIcon, Mic, Video } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface IngestPortalProps {
    onIngest: (type: 'file' | 'url' | 'text', content: any) => void;
    isProcessing: boolean;
}

export function IngestPortal({ onIngest, isProcessing }: IngestPortalProps) {
    const [mode, setMode] = useState<'drop' | 'url' | 'text'>('drop');
    const [urlInput, setUrlInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const controls = useAnimation();

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            // Ripple effect
            controls.start({
                scale: [1, 1.1, 1],
                borderColor: ["#a855f7", "#ec4899", "#a855f7"],
                transition: { duration: 0.5 }
            });
            onIngest('file', acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: mode !== 'drop',
        noKeyboard: true,
        disabled: isProcessing
    });

    // Global paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (isProcessing) return;
            const text = e.clipboardData?.getData('text');
            if (text) {
                if (text.startsWith('http')) {
                    setMode('url');
                    setUrlInput(text);
                } else if (text.length > 50) {
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
        <div className="w-full max-w-2xl mx-auto relative group">
            {/* Outer Glow / Particle Orbit Container */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={cn(
                        "w-[500px] h-[500px] rounded-full border border-dashed opacity-20 transition-all duration-500",
                        isDragActive ? "border-primary scale-110 opacity-40" : "border-muted-foreground"
                    )}
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className={cn(
                        "absolute w-[400px] h-[400px] rounded-full border border-dotted opacity-20 transition-all duration-500",
                        isDragActive ? "border-purple-500 scale-105 opacity-40" : "border-muted-foreground"
                    )}
                />
                {/* Core Glow */}
                <div className={cn(
                    "absolute w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl transition-all duration-500",
                    isDragActive && "bg-primary/20 scale-125"
                )} />
            </div>

            {/* Main Portal Interface */}
            <motion.div
                {...(getRootProps() as any)}
                animate={controls}
                whileHover={{ scale: mode === 'drop' && !isProcessing ? 1.02 : 1 }}
                className={cn(
                    "relative rounded-[2.5rem] border-2 border-dashed transition-all duration-300 min-h-[400px] flex flex-col items-center justify-center p-8 overflow-hidden backdrop-blur-md bg-background/30",
                    isDragActive ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(168,85,247,0.2)]" : "border-muted-foreground/20 hover:border-primary/50 hover:shadow-lg",
                    isProcessing && "opacity-50 pointer-events-none grayscale"
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {mode === 'drop' && (
                        <motion.div
                            key="drop"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center text-center space-y-8 z-10"
                        >
                            {/* Central Icon */}
                            <div className="relative">
                                <motion.div
                                    animate={isDragActive ? { scale: 1.2, rotate: 180 } : { scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="p-8 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full ring-1 ring-white/10 shadow-2xl backdrop-blur-sm"
                                >
                                    <Upload className={cn("w-12 h-12 text-primary transition-all", isDragActive && "text-white")} />
                                </motion.div>
                                {/* Orbiting Particles (CSS) */}
                                {isDragActive && (
                                    <>
                                        <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full" />
                                        <motion.div
                                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-full"
                                        />
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                    {isDragActive ? "Release to Absorb" : "Drop anything."}
                                </h3>
                                <p className="text-muted-foreground max-w-xs mx-auto text-lg">
                                    Lumen absorbs it.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6 border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setMode('url'); }}
                                >
                                    <LinkIcon className="w-4 h-4 mr-2 text-blue-400" />
                                    Link
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6 border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setMode('text'); }}
                                >
                                    <FileText className="w-4 h-4 mr-2 text-green-400" />
                                    Note
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6 border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        (document.querySelector('input[type="file"]') as HTMLInputElement)?.click();
                                    }}
                                >
                                    <FileIcon className="w-4 h-4 mr-2 text-orange-400" />
                                    File
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {mode === 'url' && (
                        <motion.div
                            key="url"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md space-y-6 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <LinkIcon className="w-5 h-5 text-blue-400" />
                                    </div>
                                    Ingest URL
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setMode('drop')} className="rounded-full hover:bg-white/10">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <form onSubmit={handleUrlSubmit} className="relative group/input">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover/input:opacity-100 transition-opacity" />
                                <div className="relative flex gap-2">
                                    <Input
                                        autoFocus
                                        placeholder="https://..."
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        className="h-14 text-lg bg-black/40 border-white/10 rounded-xl focus:ring-blue-500/50 pl-6"
                                    />
                                    <Button type="submit" size="icon" className="h-14 w-14 rounded-xl bg-blue-600 hover:bg-blue-500 shrink-0 shadow-lg shadow-blue-900/20">
                                        <ArrowRight className="w-6 h-6" />
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {mode === 'text' && (
                        <motion.div
                            key="text"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md space-y-6 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <FileText className="w-5 h-5 text-green-400" />
                                    </div>
                                    Quick Note
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setMode('drop')} className="rounded-full hover:bg-white/10">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-hover/input:opacity-100 transition-opacity" />
                                <Textarea
                                    autoFocus
                                    placeholder="Type your thoughts..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    className="min-h-[200px] text-base resize-none bg-black/40 border-white/10 rounded-xl focus:ring-green-500/50 p-6 leading-relaxed"
                                />
                            </div>
                            <Button onClick={handleTextSubmit} className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20 text-lg font-medium">
                                Ingest Note
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
