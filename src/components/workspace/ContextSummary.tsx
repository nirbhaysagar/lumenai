'use client';

import { DEMO_USER_ID } from '@/lib/constants';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export function ContextSummary({ contextId }: { contextId: string }) {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const fetchSummary = async () => {
        try {
            const res = await fetch(`/api/contexts/${contextId}/summary`);
            const data = await res.json();
            setSummary(data.summary);
        } catch (error) {
            console.error('Failed to fetch summary', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [contextId]);

    const handleRegenerate = async () => {
        setGenerating(true);
        toast.info('Generating new summary...');
        try {
            const res = await fetch('/api/agent/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contextId,
                    userId: DEMO_USER_ID // Hardcoded for now
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Summary generated');
                fetchSummary();
            } else {
                toast.error('Failed to generate summary');
            }
        } catch (error) {
            toast.error('Error generating summary');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="h-full p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Context Summary
                </h2>
                <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={generating}>
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {generating ? 'Generating...' : 'Regenerate'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : summary ? (
                        <div className="space-y-4">
                            {(() => {
                                try {
                                    // Try to parse if it's a string, otherwise use as is
                                    const content = typeof summary.content === 'string'
                                        ? JSON.parse(summary.content)
                                        : summary.content;

                                    return (
                                        <>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                                <ReactMarkdown>{content.summary || summary.content}</ReactMarkdown>
                                            </div>

                                            {content.takeaways && content.takeaways.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Key Takeaways</h4>
                                                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                                        {content.takeaways.map((t: string, i: number) => (
                                                            <li key={i}>{t}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {content.actions && content.actions.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Suggested Actions</h4>
                                                    <ul className="list-none space-y-1">
                                                        {content.actions.map((a: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                                                                {a}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    );
                                } catch (e) {
                                    // Fallback for plain text summaries
                                    return (
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                            <ReactMarkdown>{typeof summary.content === 'string' ? summary.content : JSON.stringify(summary.content)}</ReactMarkdown>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <p>No summary available yet.</p>
                            <Button variant="link" onClick={handleRegenerate} className="mt-2">
                                Generate one now
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
