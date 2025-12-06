'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, Folder, Hash, Brain, Loader2, CheckCircle2 } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { DEMO_USER_ID } from '@/lib/constants';

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();
    const debouncedQuery = useDebounce(query, 300);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    React.useEffect(() => {
        if (!debouncedQuery) {
            setResults(null);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?userId=${DEMO_USER_ID}&q=${encodeURIComponent(debouncedQuery)}`);
                const data = await res.json();
                setResults(data);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    const handleSelect = (callback: () => void) => {
        setOpen(false);
        callback();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
                <DialogTitle className="sr-only">Global Search</DialogTitle>
                <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    <CommandInput
                        placeholder="Search across everything..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {loading ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : (
                                "No results found."
                            )}
                        </CommandEmpty>

                        {results?.contexts?.length > 0 && (
                            <CommandGroup heading="Contexts">
                                {results.contexts.map((context: any) => (
                                    <CommandItem
                                        key={context.id}
                                        value={context.name}
                                        onSelect={() => handleSelect(() => router.push(`/contexts/${context.id}`))}
                                    >
                                        <Folder className="mr-2 h-4 w-4" />
                                        <span>{context.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results?.captures?.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Notes & Captures">
                                    {results.captures.map((capture: any) => (
                                        <CommandItem
                                            key={capture.id}
                                            value={capture.title}
                                            onSelect={() => handleSelect(() => {
                                                router.push(`/ingest?id=${capture.id}`);
                                            })}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>{capture.title || 'Untitled'}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {results?.tags?.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Tags">
                                    {results.tags.map((tag: any) => (
                                        <CommandItem
                                            key={tag.id}
                                            value={tag.name}
                                            onSelect={() => handleSelect(() => router.push(`/tags`))}
                                        >
                                            <Hash className="mr-2 h-4 w-4" />
                                            <span>{tag.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}



                        {results?.tasks?.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Tasks">
                                    {results.tasks.map((task: any) => (
                                        <CommandItem
                                            key={task.id}
                                            value={task.content}
                                            onSelect={() => handleSelect(() => { })}
                                        >
                                            <CheckCircle2 className={`mr-2 h-4 w-4 ${task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                            <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{task.content}</span>
                                            {task.priority === 'high' && <span className="ml-auto text-xs text-red-500 font-medium">High</span>}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {results?.memories?.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Memories">
                                    {results.memories.map((memory: any) => (
                                        <CommandItem
                                            key={memory.id}
                                            value={memory.snippet}
                                            onSelect={() => handleSelect(() => { })}
                                        >
                                            <Brain className="mr-2 h-4 w-4" />
                                            <span className="truncate">{memory.snippet}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog >
    );
}
