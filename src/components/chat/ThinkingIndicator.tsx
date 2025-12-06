import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ThinkingIndicatorProps {
    queueBacklog?: number;
}

export function ThinkingIndicator({ queueBacklog = 0 }: ThinkingIndicatorProps) {
    const estimatedWait = queueBacklog > 0 ? (queueBacklog * 0.8).toFixed(1) : 0;

    return (
        <div className="flex items-center gap-3 p-4 text-muted-foreground animate-pulse">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
            </div>
            <span className="text-sm font-medium">Thinking...</span>

            {queueBacklog > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs font-normal">
                    Queue: {queueBacklog} — est {estimatedWait}s
                </Badge>
            )}
        </div>
    );
}
