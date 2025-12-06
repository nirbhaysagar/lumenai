'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState } from 'react';
import { IngestPortal } from '@/components/ingest/IngestPortal';
import { IngestPipeline } from '@/components/ingest/IngestPipeline';
import { DestinationSelector } from '@/components/ingest/DestinationSelector';
import { RecentActivityGrid } from '@/components/ingest/RecentActivityGrid';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function IngestPage() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [contextId, setContextId] = useState<string>('');
    const [pipelineSteps, setPipelineSteps] = useState([
        { id: 'upload', label: 'Intake received...', status: 'pending' },
        { id: 'extract', label: 'Extracting text...', status: 'pending' },
        { id: 'chunk', label: 'Splitting into chunks...', status: 'pending' },
        { id: 'embed', label: 'Generating embeddings...', status: 'pending' },
        { id: 'index', label: 'Indexing to Vector DB...', status: 'pending' },
    ] as any[]);

    const updateStep = (id: string, status: 'processing' | 'completed' | 'error') => {
        setPipelineSteps(prev => prev.map(step =>
            step.id === id ? { ...step, status } : step
        ));
    };

    const handleIngest = async (type: 'file' | 'url' | 'text', content: any) => {
        if (!contextId) {
            toast.error('Please select a destination context');
            return;
        }

        setIsProcessing(true);
        setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

        try {
            // Step 1: Upload / Intake
            updateStep('upload', 'processing');

            const formData = new FormData();
            formData.append('userId', DEMO_USER_ID); // Hardcoded
            formData.append('contextId', contextId);
            formData.append('type', type === 'file' && content.type.includes('pdf') ? 'pdf' : type);

            if (type === 'file') {
                formData.append('file', content);
            } else if (type === 'url') {
                formData.append('url', content);
            } else {
                formData.append('text', content);
                formData.append('title', 'Quick Note');
            }

            await new Promise(r => setTimeout(r, 800)); // Visual delay
            updateStep('upload', 'completed');

            // Step 2: Extract
            updateStep('extract', 'processing');

            let res;
            if (type === 'file') {
                res = await fetch('/api/ingest', {
                    method: 'POST',
                    body: formData,
                });
            } else {
                res = await fetch('/api/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: DEMO_USER_ID,
                        contextId,
                        type,
                        url: type === 'url' ? content : undefined,
                        text: type === 'text' ? content : undefined,
                        title: type === 'text' ? 'Quick Note' : undefined
                    }),
                });
            }

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to ingest');

            updateStep('extract', 'completed');

            // Step 3: Chunk
            updateStep('chunk', 'processing');
            await new Promise(r => setTimeout(r, 600));
            updateStep('chunk', 'completed');

            // Step 4: Embed
            updateStep('embed', 'processing');
            await new Promise(r => setTimeout(r, 600));
            updateStep('embed', 'completed');

            // Step 5: Index
            updateStep('index', 'processing');
            await new Promise(r => setTimeout(r, 400));
            updateStep('index', 'completed');

            toast.success(`Memory absorbed! ${data.chunkCount} chunks added.`);

            setTimeout(() => {
                setIsProcessing(false);
                setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
            }, 2000);

        } catch (error) {
            console.error('Ingest error:', error);
            toast.error('Ingestion failed');
            setPipelineSteps(prev => {
                const processingIdx = prev.findIndex(s => s.status === 'processing');
                if (processingIdx !== -1) {
                    const newSteps = [...prev];
                    newSteps[processingIdx].status = 'error';
                    return newSteps;
                }
                return prev;
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-background to-background pointer-events-none" />

            {/* Header */}
            <div className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center pt-12 pb-20 px-4 space-y-12 z-10">
                <div className="text-center space-y-6">
                    <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                        Lumen Intake Portal
                    </h1>
                    <DestinationSelector
                        userId={DEMO_USER_ID}
                        selectedContextId={contextId}
                        onSelect={setContextId}
                    />
                </div>

                <div className="w-full max-w-2xl">
                    <IngestPortal
                        onIngest={handleIngest}
                        isProcessing={isProcessing}
                    />

                    {isProcessing ? (
                        <IngestPipeline steps={pipelineSteps} />
                    ) : (
                        <RecentActivityGrid />
                    )}
                </div>
            </div>
        </div>
    );
}
