import { motion } from 'framer-motion';
import { Plus, Folder, MoreVertical, ArrowRight, Clock, Database, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContextGridProps {
    contexts: any[];
    loading: boolean;
    onCreate: () => void;
    onDelete: (id: string) => void;
    onTogglePin?: (id: string, current: boolean) => void;
}

export function ContextGrid({ contexts, loading, onCreate, onDelete, onTogglePin }: ContextGridProps) {
    const router = useRouter();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))}
            </div>
        );
    }

    // Sort: Pinned first, then by date
    const sortedContexts = [...contexts].sort((a, b) => {
        if (a.pinned === b.pinned) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.pinned ? -1 : 1;
    });

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {/* Create New Card */}
            <motion.div variants={item}>
                <button
                    onClick={onCreate}
                    className="group relative w-full h-full min-h-[180px] rounded-xl border border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 flex flex-col items-center justify-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                        <span className="block text-sm font-medium text-foreground">Create New Context</span>
                        <span className="text-xs text-muted-foreground">Initialize a new workspace</span>
                    </div>
                </button>
            </motion.div>

            {/* Context Cards */}
            {sortedContexts.map((context) => (
                <motion.div key={context.id} variants={item}>
                    <div
                        onClick={() => router.push(`/contexts/${context.id}`)}
                        className={`group relative w-full h-full min-h-[180px] p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col justify-between ${context.pinned ? 'border-primary/40 bg-primary/5' : ''}`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    {context.pinned && (
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                    {onTogglePin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                                            onClick={() => onTogglePin(context.id, context.pinned)}
                                        >
                                            <Star className={`w-4 h-4 ${context.pinned ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                        </Button>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(context.id); }} className="text-destructive">
                                                Delete Context
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-1 truncate group-hover:text-primary transition-colors">
                                {context.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                                {context.description || 'No description provided.'}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Database className="w-3 h-3" /> {context.chunk_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(context.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-200">
                                <ArrowRight className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
