
import { Coins } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TokenBadgeProps {
    tokens: number;
    cost?: number;
}

export function TokenBadge({ tokens, cost }: TokenBadgeProps) {
    if (tokens === 0) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full cursor-help">
                        <Coins className="w-3 h-3" />
                        <span>{tokens.toLocaleString()} tokens</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Estimated cost: ${cost ? cost.toFixed(4) : '0.0000'}</p>
                    <p className="text-xs text-muted-foreground">Based on Llama 3.3 pricing</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
