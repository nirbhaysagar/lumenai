'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { Bell, Search, User, ChevronDown, LogOut, Settings, CreditCard, CheckCircle2, AlertCircle, Sun, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ProfileDialog } from '../settings/ProfileDialog';
import { SettingsDialog } from '../settings/SettingsDialog';
import { BillingDialog } from '../settings/BillingDialog';
import { DailyDigestModal } from '../DailyDigestModal';
import { TeamSwitcher } from '@/components/team/TeamSwitcher';

export function DashboardHeader() {
    const [contexts, setContexts] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const [showDigest, setShowDigest] = useState(false);
    const [currentDigest, setCurrentDigest] = useState<any>(null);

    const router = useRouter();

    useEffect(() => {
        // Fetch Contexts
        fetch(`/api/contexts?userId=${DEMO_USER_ID}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setContexts(data);
            })
            .catch(err => console.error('Failed to fetch contexts', err));

        // Fetch Notifications
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications?userId=${DEMO_USER_ID}`);
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);

                // Check for unread digest
                const digest = data.notifications.find((n: any) => n.type === 'digest' && !n.is_read);
                if (digest) {
                    setCurrentDigest(digest);
                    setShowDigest(true);
                    markAsRead(digest.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id, is_read: true }),
            });
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleContextSelect = (id: string) => {
        router.push(`/contexts/${id}`);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <>
            <ProfileDialog open={showProfile} onOpenChange={setShowProfile} />
            <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
            <BillingDialog open={showBilling} onOpenChange={setShowBilling} />
            <DailyDigestModal open={showDigest} onOpenChange={setShowDigest} digest={currentDigest} />

            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => router.push('/')}>
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary">L</span>
                            </div>
                            <span className="hidden md:inline">Lumen AI</span>
                        </div>

                        {/* Team Switcher */}
                        <TeamSwitcher />

                        {/* Context Switcher - Separator */}
                        <div className="h-6 w-px bg-border" />

                        {/* Context Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8 gap-2 border-dashed">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    All Contexts
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[240px]">
                                <DropdownMenuLabel>Switch Context</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/contexts')}>
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                    All Contexts
                                </DropdownMenuItem>
                                {contexts.map(ctx => (
                                    <DropdownMenuItem key={ctx.id} onClick={() => handleContextSelect(ctx.id)}>
                                        <span className="w-2 h-2 rounded-full bg-slate-300 mr-2" />
                                        {ctx.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/contexts')}>
                                    + Create New Context
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Trigger */}
                        <Button variant="outline" className="h-9 w-64 justify-start text-muted-foreground bg-muted/50 hidden md:flex" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
                            <Search className="mr-2 h-4 w-4" />
                            <span>Search...</span>
                            <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </Button>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[320px]">
                                <DropdownMenuLabel className="flex justify-between items-center">
                                    Notifications
                                    <span className="text-xs font-normal text-muted-foreground cursor-pointer hover:text-primary" onClick={() => notifications.forEach(n => markAsRead(n.id))}>Mark all as read</span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => {
                                            markAsRead(n.id);
                                            if (n.type === 'digest') {
                                                setCurrentDigest(n);
                                                setShowDigest(true);
                                            }
                                        }}>
                                            <div className="flex items-center gap-2 w-full">
                                                {n.type === 'digest' ? <Sun className="w-4 h-4 text-orange-500" /> :
                                                    n.type === 'memory' ? <Brain className="w-4 h-4 text-purple-500" /> :
                                                        <AlertCircle className="w-4 h-4 text-blue-500" />}
                                                <span className={`font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                                                <span className="ml-auto text-xs text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {n.content?.summary && <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{n.content.summary}</p>}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Avatar */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/avatar.png" />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">User</p>
                                        <p className="text-xs leading-none text-muted-foreground">user@lumen.ai</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setShowProfile(true)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowBilling(true)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/tags')}>
                                    <div className="flex items-center">
                                        <span className="mr-2 h-4 w-4 flex items-center justify-center font-bold text-xs">#</span>
                                        <span>Manage Tags</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/login')}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
        </>
    );
}
