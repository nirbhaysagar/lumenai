import { motion } from 'framer-motion';
import { Activity, Database, Cpu, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from '@/hooks/useCommandPalette';

interface DashboardHeroProps {
    stats: any;
}

export function DashboardHero({ stats }: DashboardHeroProps) {
    const router = useRouter();
    const { open } = useCommandPalette();
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            // Trigger command palette or navigate to search
            // Trigger command palette or navigate to search
            open();
            setQuery(''); // Clear local query since palette has its own state
            // Or use router to go to a search page if one existed
        }
    };

    return (
        <div className="relative w-full py-12 px-6 overflow-hidden rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-background/0 to-background/0 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-8">

                {/* Status Indicator */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                >
                    <div className="relative w-2 h-2">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                        <div className="relative w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                    <span className="text-[10px] font-mono font-medium text-emerald-500 tracking-wider uppercase">
                        System Online
                    </span>
                </motion.div>

                {/* Main Title */}
                <div className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50"
                    >
                        Lumen Command Center
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto"
                    >
                        Your second brain is active. Monitoring {stats?.totalMemories || 0} memories across {stats?.activeContexts || 0} contexts.
                    </motion.p>
                </div>

                {/* Quick Capture / Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-xl relative group"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 transition duration-500 blur" />
                    <form onSubmit={handleSearch} className="relative flex items-center bg-black/80 rounded-full border border-white/10 p-1.5">
                        <Search className="w-5 h-5 text-muted-foreground ml-3" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask Lumen or run a command..."
                            className="border-0 bg-transparent focus-visible:ring-0 text-base h-10 placeholder:text-muted-foreground/50"
                        />
                        <div className="flex items-center gap-1 pr-2">
                            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                            <Button size="sm" className="rounded-full h-8 px-4 bg-white/10 hover:bg-white/20 text-white border-0">
                                Run
                            </Button>
                        </div>
                    </form>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8"
                >
                    <StatCard icon={Database} label="Total Memories" value={stats?.totalMemories || 0} />
                    <StatCard icon={Cpu} label="Active Agents" value={stats?.activeAgents || 3} />
                    <StatCard icon={Activity} label="Ingest Rate" value="98%" />
                    <StatCard icon={Search} label="Recall Score" value="4.8/5" />
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
            <Icon className="w-5 h-5 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
    );
}
