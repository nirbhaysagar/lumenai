'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, Cpu, FileText, Split, Database, Tag, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngestPipelineProps {
    steps: {
        id: string;
        label: string;
        status: 'pending' | 'processing' | 'completed' | 'error';
    }[];
}

export function IngestPipeline({ steps }: IngestPipelineProps) {
    const getIcon = (id: string) => {
        switch (id) {
            case 'upload': return <FileText className="w-4 h-4" />;
            case 'extract': return <Cpu className="w-4 h-4" />;
            case 'chunk': return <Split className="w-4 h-4" />;
            case 'embed': return <Database className="w-4 h-4" />;
            case 'index': return <Tag className="w-4 h-4" />;
            default: return <Circle className="w-4 h-4" />;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-12 space-y-3 font-mono text-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Ingestion Pipeline Active
            </div>

            {steps.map((step, index) => (
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                        "relative flex items-center gap-4 p-3 rounded-lg border transition-all duration-300 overflow-hidden",
                        step.status === 'processing' ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]" :
                            step.status === 'completed' ? "bg-background/50 border-green-500/20" :
                                "bg-background/20 border-transparent opacity-50"
                    )}
                >
                    {/* Shimmer Effect for Processing */}
                    {step.status === 'processing' && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    )}

                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md border",
                        step.status === 'processing' ? "border-primary text-primary" :
                            step.status === 'completed' ? "border-green-500 bg-green-500/10 text-green-500" :
                                "border-muted-foreground/30 text-muted-foreground"
                    )}>
                        {step.status === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                                getIcon(step.id)}
                    </div>

                    <div className="flex-1 z-10">
                        <span className={cn(
                            "font-medium",
                            step.status === 'processing' ? "text-primary" :
                                step.status === 'completed' ? "text-foreground" :
                                    "text-muted-foreground"
                        )}>
                            {step.label}
                        </span>
                    </div>

                    {step.status === 'processing' && (
                        <div className="text-xs text-primary animate-pulse">Running...</div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
