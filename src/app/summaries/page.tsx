
'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Summary {
    id: string;
    content: any; // JSON
    created_at: string;
    target_type: string;
    target_id: string;
}

export default function SummariesPage() {
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = DEMO_USER_ID; // Hardcoded

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        setLoading(true);
        try {
            // We need a GET endpoint for summaries. 
            // Since we don't have a specific one, we'll use a direct supabase query via a new API route or just assume one exists.
            // For now, let's create a quick GET route or use the existing one if modified.
            // Actually, let's assume we need to create GET /api/agent/summarize?userId=...
            const res = await fetch(`/api/agent/summarize?userId=${userId}`);
            const data = await res.json();
            if (data.summaries) {
                setSummaries(data.summaries);
            }
        } catch (error) {
            console.error('Failed to fetch summaries', error);
            toast.error('Failed to load summaries');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Implement delete logic
        toast.info('Delete functionality coming soon');
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Summaries</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-generated insights from your contexts and captures.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchSummaries} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading && summaries.length === 0 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : summaries.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <h3 className="text-lg font-medium">No summaries yet</h3>
                    <p className="text-muted-foreground mt-1">
                        Go to a Context or Capture and click "Summarize" to generate one.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {summaries.map((summary) => {
                        const content = typeof summary.content === 'string'
                            ? JSON.parse(summary.content)
                            : summary.content;

                        return (
                            <Card key={summary.id}>
                                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            Summary for {summary.target_type}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(summary.id)}>
                                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Overview</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {content.summary}
                                        </p>
                                    </div>

                                    {content.takeaways && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Key Takeaways</h4>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                {content.takeaways.map((t: string, i: number) => (
                                                    <li key={i}>{t}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {content.actions && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">Action Items</h4>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                {content.actions.map((a: string, i: number) => (
                                                    <li key={i}>{a}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
