'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Link as LinkIcon, Image as ImageIcon, MessageSquare, Clock, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ActivityFeed() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Hardcoded userId
    const userId = DEMO_USER_ID;

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch(`/api/activity?userId=${userId}`);
                const data = await res.json();
                if (data.activities) {
                    setActivities(data.activities);
                }
            } catch (error) {
                console.error('Failed to fetch activity', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
        // Poll every 10 seconds
        const interval = setInterval(fetchActivity, 10000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'url': return LinkIcon;
            case 'pdf': return FileText;
            case 'image': return ImageIcon;
            case 'chat': return MessageSquare;
            default: return FileText;
        }
    };

    const getColor = (type: string, status: string) => {
        if (status === 'failed') return 'text-red-500';
        if (status === 'processing') return 'text-yellow-500 animate-pulse';

        switch (type) {
            case 'url': return 'text-blue-500';
            case 'pdf': return 'text-red-500';
            case 'chat': return 'text-green-500';
            case 'image': return 'text-purple-500';
            default: return 'text-muted-foreground';
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {activities.map((activity) => {
                        const Icon = getIcon(activity.type);
                        const color = getColor(activity.type, activity.status);

                        return (
                            <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-full bg-background border ${activity.status === 'failed' ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                                        {activity.status === 'failed' ? (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium truncate">{activity.title}</div>
                                            {activity.status === 'failed' && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">Failed</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{activity.error || 'Unknown error'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => console.log('View activity', activity.id)}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
