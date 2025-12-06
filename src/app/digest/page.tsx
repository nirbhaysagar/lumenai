'use client';

import { DEMO_USER_ID } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Calendar, Coffee, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export default function DigestPage() {
    const [digests, setDigests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const userId = DEMO_USER_ID;

    useEffect(() => {
        fetchDigests();
    }, []);

    const fetchDigests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/digest?userId=${userId}`);
            const data = await res.json();
            if (data.digests) {
                setDigests(data.digests);
            }
        } catch (error) {
            console.error('Failed to fetch digests', error);
            toast.error('Failed to load digests');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/digest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                toast.success('Digest generation started! Check back in a moment.');
                // Poll for new digest after a delay
                setTimeout(fetchDigests, 5000);
            } else {
                toast.error('Failed to start generation');
            }
        } catch (error) {
            toast.error('Error triggering digest');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-3xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Coffee className="w-8 h-8 text-primary" />
                        Daily Digest
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your AI-curated morning briefing.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={generating}>
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    Generate Now
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : digests.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No digests yet</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        Start your day with an AI summary of your progress and tasks.
                    </p>
                    <Button variant="outline" onClick={handleGenerate}>Create First Digest</Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {digests.map((digest) => {
                        const content = typeof digest.content === 'string' ? JSON.parse(digest.content) : digest.content;
                        return (
                            <Card key={digest.id} className="border-l-4 border-l-primary">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-muted-foreground" />
                                            {new Date(digest.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </CardTitle>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(digest.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Greeting */}
                                    <div className="bg-primary/5 p-4 rounded-lg">
                                        <p className="text-lg font-medium text-primary">
                                            {content.greeting || "Good Morning!"}
                                        </p>
                                    </div>

                                    {/* Summary */}
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Yesterday's Progress</h4>
                                        <p className="leading-relaxed">
                                            {content.summary || "No activity recorded yesterday."}
                                        </p>
                                    </div>

                                    {/* Focus */}
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Today's Focus</h4>
                                        <p className="leading-relaxed">
                                            {content.focus || "Set your goals for today!"}
                                        </p>
                                    </div>

                                    {/* Memory */}
                                    {content.memory && (
                                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Resurfaced Memory
                                            </h4>
                                            <p className="text-sm italic text-muted-foreground">
                                                "{content.memory}"
                                            </p>
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
