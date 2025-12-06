'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);

    const handleJoinWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setJoined(true);
                toast.success('Joined waitlist!');
            } else {
                toast.error('Failed to join waitlist');
            }
        } catch (error) {
            toast.error('Error joining waitlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="container mx-auto py-6 flex justify-between items-center">
                <div className="font-bold text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Lumen AI
                </div>
                <a href="/demo">
                    <Button variant="outline">Try Demo</Button>
                </a>
            </header>

            <main className="flex-1 container mx-auto flex flex-col items-center justify-center text-center py-20 space-y-8">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl">
                    Turn Information into <span className="text-primary">Intelligence</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                    Ingest any content, organize it into contexts, and chat with your personal knowledge base using advanced RAG agents.
                </p>

                <div className="w-full max-w-md">
                    {joined ? (
                        <Card className="bg-green-500/10 border-green-500/20">
                            <CardContent className="pt-6 flex flex-col items-center gap-2 text-green-600">
                                <CheckCircle className="w-8 h-8" />
                                <p className="font-medium">You're on the list! We'll be in touch.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12"
                            />
                            <Button type="submit" size="lg" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Waitlist'}
                            </Button>
                        </form>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-16 text-left w-full max-w-5xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingest Anything</CardTitle>
                            <CardDescription>URLs, Text, PDFs (soon)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Capture content from anywhere. We automatically chunk, embed, and tag it for instant retrieval.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contextual Chat</CardTitle>
                            <CardDescription>RAG-powered Agents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Create specific contexts for projects. Chat with your data using state-of-the-art LLMs with citations.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Actionable Insights</CardTitle>
                            <CardDescription>Summaries & Deduplication</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Generate summaries, extract action items, and automatically deduplicate redundant information.
                        </CardContent>
                    </Card>
                </div>
            </main>

            <footer className="border-t py-8 text-center text-muted-foreground text-sm">
                © 2024 Lumen AI. All rights reserved.
            </footer>
        </div>
    );
}
