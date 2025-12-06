'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
    return (
        <div className="container mx-auto py-20 max-w-4xl text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight">Experience Lumen AI</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Try out the core features in a sandbox environment. No account required.
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardHeader>
                        <CardTitle>Interactive Chat</CardTitle>
                        <CardDescription>
                            Chat with a pre-loaded knowledge base about "Artificial Intelligence".
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            See how RAG works with inline citations, streaming responses, and context awareness.
                        </p>
                        <Link href="/chat/demo-context">
                            <Button className="w-full">
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Launch Chat Demo
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                    <CardHeader>
                        <CardTitle>Live Ingestion</CardTitle>
                        <CardDescription>
                            Ingest a URL or text and see it processed in real-time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Watch the pipeline chunk, embed, and tag your content.
                        </p>
                        <Link href="/ingest">
                            <Button variant="outline" className="w-full">
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Go to Ingestion
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-12">
                <p className="text-sm text-muted-foreground mb-4">
                    Ready to build your own knowledge base?
                </p>
                <Link href="/landing">
                    <Button variant="ghost">Join the Waitlist</Button>
                </Link>
            </div>
        </div>
    );
}
