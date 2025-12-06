'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

import { useState, useEffect } from 'react';

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('lumen_notifications_enabled');
        if (stored !== null) {
            setNotificationsEnabled(stored === 'true');
        }
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your application preferences and configurations.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearance</h4>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme">Theme</Label>
                            <Select defaultValue="dark">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notifications</h4>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-xs text-muted-foreground">Receive daily digests via email.</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Desktop Notifications</Label>
                                <p className="text-xs text-muted-foreground">Show popup alerts for new tasks.</p>
                            </div>
                            <Switch
                                checked={notificationsEnabled}
                                onCheckedChange={(checked) => {
                                    setNotificationsEnabled(checked);
                                    localStorage.setItem('lumen_notifications_enabled', String(checked));
                                    if (checked && 'Notification' in window) {
                                        Notification.requestPermission();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI Preferences</h4>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-Summarization</Label>
                                <p className="text-xs text-muted-foreground">Automatically summarize new contexts.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
