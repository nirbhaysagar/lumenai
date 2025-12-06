'use client';

import { DEMO_USER_ID } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Calendar, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface RecallStats {
    dueToday: number;
    totalActive: number;
    reviewedToday: number;
    streak: number;
}

export function RecallStatsCard() {
    const [stats, setStats] = useState<RecallStats>({
        dueToday: 0,
        totalActive: 0,
        reviewedToday: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);

    const userId = DEMO_USER_ID;

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/recall/stats?userId=${userId}`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch recall stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="h-[180px] bg-muted/20 animate-pulse rounded-xl" />;
    }

    return (
        <Card className="h-full overflow-hidden relative border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        Active Recall
                    </div>
                    {stats.dueToday > 0 && (
                        <Badge variant="default" className="bg-primary">
                            {stats.dueToday} due
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs">Due Today</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.dueToday}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="text-xs">Total Active</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.totalActive}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Brain className="w-3.5 h-3.5" />
                            <span className="text-xs">Reviewed</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.reviewedToday}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs">Streak</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-500">{stats.streak} days</p>
                    </div>
                </div>

                {/* Action Button */}
                <Link href="/recall" className="block">
                    <Button
                        className="w-full"
                        variant={stats.dueToday > 0 ? "default" : "outline"}
                        size="sm"
                    >
                        {stats.dueToday > 0 ? 'Start Review' : 'View Recall Deck'}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
