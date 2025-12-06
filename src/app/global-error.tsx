'use client';

import { useEffect } from 'react';
import { ErrorCard } from '@/components/ui/error-card';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <ErrorCard
                        title="Critical System Error"
                        description="A critical error occurred in the root layout. Please refresh the page."
                        retry={() => window.location.reload()}
                    />
                </div>
            </body>
        </html>
    );
}
