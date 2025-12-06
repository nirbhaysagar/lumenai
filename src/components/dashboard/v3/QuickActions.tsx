'use client';

import { Upload, FolderPlus, Layout, Brain, Command, Hash, HardDrive, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { GoogleDrivePicker } from '@/components/integrations/GoogleDrivePicker';

export function QuickActions({ onIngest, onCreateContext }: { onIngest: () => void, onCreateContext: () => void }) {
    const router = useRouter();
    const { open } = useCommandPalette();

    const actions = [
        {
            label: 'Ingest',
            icon: Upload,
            onClick: onIngest,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10 hover:bg-blue-500/20'
        },
        {
            label: 'New Context',
            icon: FolderPlus,
            onClick: onCreateContext,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10 hover:bg-purple-500/20'
        },
        {
            label: 'Workspace',
            icon: Layout,
            onClick: () => router.push('/workspace'),
            color: 'text-green-500',
            bg: 'bg-green-500/10 hover:bg-green-500/20'
        },
        {
            label: 'Daily Recall',
            icon: Brain,
            onClick: () => router.push('/recall'),
            color: 'text-orange-500',
            bg: 'bg-orange-500/10 hover:bg-orange-500/20'
        },
        {
            label: 'Palette',
            icon: Command,
            onClick: () => open(),
            color: 'text-pink-500',
            bg: 'bg-pink-500/10 hover:bg-pink-500/20'
        },
        {
            label: 'Editor',
            icon: PenTool,
            onClick: () => router.push('/editor'),
            color: 'text-teal-500',
            bg: 'bg-teal-500/10 hover:bg-teal-500/20'
        },
        {
            label: 'Tags',
            icon: Hash,
            onClick: () => router.push('/tags'),
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10 hover:bg-yellow-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {actions.map((action, i) => (
                <button
                    key={i}
                    onClick={action.onClick}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-border transition-all duration-200 ${action.bg} group`}
                >
                    <div className={`p-3 rounded-full bg-background/50 mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                </button>
            ))}

            {/* Google Drive Integration */}
            <GoogleDrivePicker>
                <button
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-border transition-all duration-200 bg-cyan-500/10 hover:bg-cyan-500/20 group"
                >
                    <div className="p-3 rounded-full bg-background/50 mb-3 group-hover:scale-110 transition-transform">
                        <HardDrive className="w-6 h-6 text-cyan-500" />
                    </div>
                    <span className="text-sm font-medium">Google Drive</span>
                </button>
            </GoogleDrivePicker>
        </div>
    );
}
