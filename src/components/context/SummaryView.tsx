'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle, List } from 'lucide-react';
import { toast } from 'sonner';

interface SummaryViewProps {
    contextId: string;
}

export function SummaryView({ contextId }: SummaryViewProps) {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    const generateSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/agent/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contextId }),
            });
            const data = await res.json();
            if (data.content) {
                setSummary(JSON.parse(data.content));
            }
        } catch (error) {
            console.error('Failed to generate summary', error);
            toast.error('Failed to generate summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!summary && !loading) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generate Context Summary</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    Create a high-level summary of all memories in this context, including key takeaways and action items.
                </p>
                <Button onClick={generateSummary}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summary
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing memories...</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full p-4">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Executive Summary
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {summary.summary}
                    </p>
                </div>

                <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Key Takeaways
                    </h4>
                    <ul className="space-y-2">
                        {summary.takeaways?.map((item: string, i: number) => (
                            <li key={i} className="text-sm flex gap-2 items-start bg-muted/30 p-2 rounded">
                                <span className="text-primary font-bold">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Action Items
                    </h4>
                    <div className="space-y-2">
                        {summary.actions?.map((item: string, i: number) => (
                            <div key={i} className="text-sm flex gap-2 items-start border p-2 rounded bg-background">
                                <div className="mt-0.5 w-4 h-4 border rounded-sm" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={generateSummary}>
                        Regenerate
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}

import { ScrollArea } from '@/components/ui/scroll-area';
