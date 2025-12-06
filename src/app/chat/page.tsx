'use client';

import { useSearchParams } from 'next/navigation';
import { ChatPanel } from '@/components/workspace/ChatPanel';
import { DEMO_USER_ID } from '@/lib/constants';
import { Suspense } from 'react';

function ChatPageContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="flex-1 overflow-hidden">
                <ChatPanel
                    contextId="" // Global chat uses empty string or specific ID
                    userId={DEMO_USER_ID}
                    initialMessage={initialQuery}
                    onInsertRef={() => { }} // No-op for global chat page
                    defaultToGlobal={true}
                />
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading chat...</div>}>
            <ChatPageContent />
        </Suspense>
    );
}
