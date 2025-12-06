import { LucideIcon, ChevronRight, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CommandItemProps {
    id: string;
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    active: boolean;
    onSelect: () => void;
    onHover?: () => void;
    type?: 'command' | 'context' | 'capture' | 'memory' | 'task';
    shortcut?: string;
}

export function CommandItem({ id, title, subtitle, icon: Icon, active, onSelect, onHover, type = 'command', shortcut }: CommandItemProps) {
    return (
        <motion.div
            layoutId={active ? "active-item" : undefined}
            className={cn(
                "group flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 relative overflow-hidden",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
            )}
            onClick={onSelect}
            onMouseEnter={onHover} // Select on hover
        >
            {active && (
                <motion.div
                    layoutId="active-glow"
                    className="absolute inset-0 bg-primary/5 border-l-2 border-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}

            <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md border transition-colors z-10",
                active ? "border-primary/30 bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-muted-foreground"
            )}>
                {Icon && <Icon className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 z-10">
                <div className={cn("font-medium text-sm truncate", active ? "text-foreground" : "text-foreground/80")}>
                    {title}
                </div>
                {subtitle && (
                    <div className="text-xs text-muted-foreground truncate opacity-70">
                        {subtitle}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 z-10">
                {shortcut && (
                    <div className="hidden group-hover:flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {shortcut}
                    </div>
                )}
                {active && (
                    <CornerDownLeft className="w-3 h-3 text-primary animate-pulse" />
                )}
            </div>
        </motion.div>
    );
}
