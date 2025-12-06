'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useState, useEffect } from 'react';

import { FileText, Link as LinkIcon, Image as ImageIcon, Clock, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivityGrid() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                // Hardcoded userId for now, should be dynamic
                const userId = DEMO_USER_ID;
                const res = await fetch(`/api/captures?userId=${userId}&limit=5`);
                const data = await res.json();
                if (data.captures) {
                    setActivities(data.captures);
                }
            } catch (error) {
                console.error('Failed to fetch activities', error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchActivities, 5000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4 text-orange-400" />;
            case 'url': return <LinkIcon className="w-4 h-4 text-blue-400" />;
            case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
            default: return <FileText className="w-4 h-4 text-green-400" />;
        }
    };

    if (loading && activities.length === 0) {
        return <div className="text-center text-muted-foreground text-sm mt-12">Loading recent activity...</div>;
    }

    return (
        <div className="w-full max-w-2xl mx-auto mt-16 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">Recent Ingestions</h3>
            <div className="grid gap-3">
                {activities.map((item) => (
                    <Card key={item.id} className="p-3 flex items-center gap-4 bg-background/40 hover:bg-background/60 transition-colors border-white/5">
                        <div className="p-2 rounded-md bg-muted/50">
                            {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate" title={item.title}>{item.title || 'Untitled'}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 capitalize">{item.status || 'processed'}</Badge>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/captures/${item.id}`, '_blank')}>
                            <ArrowUpRight className="w-4 h-4" />
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
