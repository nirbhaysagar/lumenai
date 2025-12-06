'use client';

import { useEffect } from 'react';
import { ErrorCard } from '@/components/ui/error-card';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Route Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter">Oops!</h1>
                    <p className="text-muted-foreground">We encountered an unexpected issue.</p>
                </div>

                <ErrorCard
                    title={error.name || "Application Error"}
                    description={error.message || "Something went wrong while loading this page."}
                    retry={reset}
                />

                <div className="flex justify-center">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2">
                            <Home className="w-4 h-4" />
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
