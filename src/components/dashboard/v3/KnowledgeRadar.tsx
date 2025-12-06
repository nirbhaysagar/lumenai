'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

export function KnowledgeRadar() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // TODO: Use actual user ID context
                const userId = DEMO_USER_ID;
                const res = await fetch(`/api/stats?userId=${userId}`);
                const json = await res.json();
                if (json.knowledgeGraph) {
                    setData(json.knowledgeGraph);
                }
            } catch (error) {
                console.error('Failed to fetch knowledge graph data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Card className="col-span-1 flex items-center justify-center h-[350px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Knowledge Health
                </CardTitle>
                <CardDescription>
                    Real-time analysis of your memory bank.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="hsl(var(--foreground))" strokeOpacity={0.2} />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar
                                name="Current State"
                                dataKey="A"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fill="hsl(var(--primary))"
                                fillOpacity={0.5}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>Live Metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted" />
                        <span>Target Baseline</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
