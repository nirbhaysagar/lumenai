'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity, Server, Database, Zap } from 'lucide-react';

interface SystemOverviewProps {
    stats: any;
    loading: boolean;
}

export function SystemOverview({ stats, loading }: SystemOverviewProps) {
    if (loading) {
        return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
        </div>;
    }

    const items = [
        {
            label: 'System Status',
            value: stats?.systemHealth === 'operational' ? 'Operational' : 'Issues Detected',
            icon: <Activity className="w-4 h-4 text-green-500" />,
            sub: 'All systems normal',
            color: 'text-green-500'
        },
        {
            label: 'Active Workers',
            value: '5 Active', // Mocked for now, connect to real stats later
            icon: <Server className="w-4 h-4 text-blue-500" />,
            sub: 'Processing queues',
            color: 'text-blue-500'
        },
        {
            label: 'Queue Backlog',
            value: stats?.queues?.totalWaiting || '0',
            icon: <Database className="w-4 h-4 text-orange-500" />,
            sub: 'Items pending',
            color: 'text-orange-500'
        },
        {
            label: 'Token Usage',
            value: '112', // Mocked
            icon: <Zap className="w-4 h-4 text-yellow-500" />,
            sub: 'Used today',
            color: 'text-yellow-500'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, i) => (
                <Card key={i} className="bg-muted/30 border-none shadow-sm hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                            {item.icon}
                        </div>
                        <div>
                            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                            <div className="text-[10px] text-muted-foreground">{item.sub}</div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
