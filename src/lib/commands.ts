import { LucideIcon, LayoutDashboard, Upload, FolderPlus, Clipboard, FileText, RefreshCw, Search, History, Sun, Moon, Folder, CheckSquare } from 'lucide-react';

export type CommandAction =
    | { type: 'navigate'; url: string }
    | { type: 'function'; fn: () => void | Promise<void> }
    | { type: 'server'; commandId: string; args?: any };

export interface Command {
    id: string;
    title: string;
    description?: string;
    icon: LucideIcon;
    action: CommandAction;
    keywords?: string[];
    shortcut?: string;
}

export const staticCommands: Command[] = [
    {
        id: 'open-dashboard',
        title: 'Open Dashboard',
        description: 'Go to the main command center',
        icon: LayoutDashboard,
        action: { type: 'navigate', url: '/' },
        keywords: ['home', 'main'],
    },
    {
        id: 'open-ingest',
        title: 'Open Ingest Portal',
        description: 'Feed data to Lumen',
        icon: Upload,
        action: { type: 'navigate', url: '/ingest' },
        keywords: ['upload', 'import', 'file'],
        shortcut: 'G I',
    },
    {
        id: 'create-context',
        title: 'Create Context',
        description: 'Start a new workspace',
        icon: FolderPlus,
        action: { type: 'navigate', url: '/contexts' },
        keywords: ['new', 'project', 'workspace'],
    },
    {
        id: 'summarize-context',
        title: 'Summarize Context',
        description: 'Generate a summary for the current context',
        icon: FileText,
        action: { type: 'server', commandId: 'summarize-context' },
        keywords: ['summary', 'digest', 'report'],
    },
    {
        id: 'run-dedup',
        title: 'Run Deduplication',
        description: 'Clean up duplicate memories',
        icon: RefreshCw,
        action: { type: 'server', commandId: 'run-dedup' },
        keywords: ['clean', 'optimize', 'deduplicate'],
    },
    {
        id: 'generate-tasks',
        title: 'Extract Tasks',
        description: 'Find actionable items in memories',
        icon: CheckSquare,
        action: { type: 'server', commandId: 'generate-tasks' },
        keywords: ['todo', 'action', 'extract'],
    },
    {
        id: 'ingest-clipboard',
        title: 'Ingest Clipboard',
        description: 'Process text/URL from clipboard',
        icon: Clipboard,
        action: {
            type: 'function', fn: async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        window.location.href = `/ingest?auto=true&content=${encodeURIComponent(text.slice(0, 100))}`;
                    }
                } catch (e) {
                    console.error('Clipboard access failed', e);
                }
            }
        },
        keywords: ['paste', 'copy'],
    },
    {
        id: 'search-contexts',
        title: 'Browse Contexts',
        description: 'Switch to another workspace',
        icon: Folder,
        action: { type: 'navigate', url: '/contexts' },
        keywords: ['find', 'switch', 'jump', 'project'],
    },
    {
        id: 'add-task',
        title: 'Add Task',
        description: 'Create a new action item',
        icon: CheckSquare,
        action: { type: 'navigate', url: '/tasks' },
        keywords: ['todo', 'create', 'new'],
    },
    {
        id: 'show-recent',
        title: 'Show Recent Captures',
        description: 'View latest ingested items',
        icon: History,
        action: { type: 'navigate', url: '/captures' },
        keywords: ['history', 'latest'],
    },
    {
        id: 'toggle-theme',
        title: 'Toggle Theme',
        description: 'Switch between light and dark mode',
        icon: Sun,
        action: {
            type: 'function', fn: () => {
                const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                document.documentElement.classList.toggle('dark');
            }
        },
        keywords: ['dark', 'light', 'mode'],
    },
];
