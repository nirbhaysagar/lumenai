
'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Link as LinkIcon, Image as ImageIcon, Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    created_at: string;
    chunk_count: number;
}

export function RecentActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = DEMO_USER_ID; // Hardcoded for now

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch(`/api/captures?userId=${userId}&limit=5`);
                const data = await res.json();
                if (data.captures) {
                    setActivities(data.captures);
                }
            } catch (error) {
                console.error('Failed to fetch activity', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
            case 'url': return <LinkIcon className="w-4 h-4 text-blue-500" />;
            case 'image': return <ImageIcon className="w-4 h-4 text-purple-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No recent activity.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((item) => (
                            <Link
                                key={item.id}
                                href={`/captures/${item.id}`}
                                className="flex items-start gap-3 group hover:bg-muted/50 p-2 rounded-md transition-colors -mx-2"
                            >
                                <div className="mt-0.5 p-1.5 bg-muted rounded-md group-hover:bg-background transition-colors">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                        {item.title || 'Untitled Capture'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                                        <span>•</span>
                                        <span>{item.chunk_count} chunks</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
