import { Search, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CommandInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function CommandInput({ value, onChange, placeholder = "Ask Lumen or run a command..." }: CommandInputProps) {
    return (
        <div className="relative flex items-center border-b border-white/10 px-4 py-4">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <input
                autoFocus
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/50 text-foreground"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50 font-mono">
                <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    <Command className="w-3 h-3" /> K
                </span>
                <span>to open</span>
            </div>
        </div>
    );
}
