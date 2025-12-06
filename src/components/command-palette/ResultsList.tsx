import { CommandItem } from './CommandItem';
import { Command } from '@/lib/commands';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultsListProps {
    results: {
        commands: Command[];
        contexts: any[];
        captures: any[];
        memories: any[];
    };
    selectedIndex: number;
    onSelect: (index: number) => void;
    onExecute: (item: any) => void;
}

export function ResultsList({ results, selectedIndex, onSelect, onExecute }: ResultsListProps) {
    let globalIndex = 0;

    const renderSection = (title: string, items: any[], type: 'command' | 'context' | 'capture' | 'memory') => {
        if (!items || items.length === 0) return null;

        return (
            <div className="mb-4">
                <h4 className="px-4 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">
                    {title}
                </h4>
                <div className="space-y-1">
                    {items.map((item) => {
                        const currentIndex = globalIndex;
                        const isActive = selectedIndex === currentIndex;
                        globalIndex++;

                        return (
                            <CommandItem
                                key={item.id}
                                id={item.id}
                                title={item.title || item.name} // Handle different data shapes
                                subtitle={item.description || item.meta || item.snippet}
                                icon={item.icon} // Commands have icons, others might need mapping
                                active={isActive}
                                onSelect={() => onExecute(item)}
                                onHover={() => onSelect(currentIndex)}
                                type={type}
                                shortcut={item.shortcut}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <ScrollArea className="h-[400px] py-2">
            {renderSection('Commands', results.commands, 'command')}
            {renderSection('Contexts', results.contexts, 'context')}
            {renderSection('Recent Captures', results.captures, 'capture')}
            {renderSection('Memories', results.memories, 'memory')}

            {globalIndex === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <p className="text-sm">No results found.</p>
                </div>
            )}
        </ScrollArea>
    );
}
