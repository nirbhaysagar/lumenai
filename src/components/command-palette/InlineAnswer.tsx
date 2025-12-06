import { Sparkles, ArrowRight, MessageSquare, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Source {
    id: string;
    captureId: string;
    snippet: string;
    score: number;
}

interface InlineAnswerProps {
    answer: string;
    sources: Source[];
    isLoading: boolean;
    onAction: (action: string) => void;
}

export function InlineAnswer({ answer, sources, isLoading, onAction }: InlineAnswerProps) {
    if (isLoading) {
        return (
            <div className="p-4 border-b border-white/10 bg-white/5 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary/50" />
                    <div className="h-4 w-24 bg-white/10 rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-[90%] bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    if (!answer) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-b border-white/10 bg-gradient-to-b from-primary/10 to-transparent"
        >
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart Answer</span>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed">
                    {answer}
                </p>

                {sources.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {sources.map((source, i) => (
                            <div key={i} className="shrink-0 max-w-[200px] p-2 rounded bg-black/20 border border-white/5 text-[10px] text-muted-foreground truncate">
                                {source.snippet}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 hover:bg-white/10"
                        onClick={() => onAction('chat')}
                    >
                        <MessageSquare className="w-3 h-3" />
                        Open Chat
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 hover:bg-white/10"
                        onClick={() => onAction('copy')}
                    >
                        <Copy className="w-3 h-3" />
                        Copy
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
