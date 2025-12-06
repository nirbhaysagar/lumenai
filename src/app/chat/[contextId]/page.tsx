import { Suspense } from 'react';
import ChatClient from '@/components/chat/ChatClient';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/constants';

interface PageProps {
    params: Promise<{ contextId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
    const { contextId } = await params;

    // In a real app, we'd fetch the user ID from the session
    // For this demo/testing, we'll use a hardcoded or query param user ID if possible,
    // but server components don't access query params easily without 'searchParams' prop.
    // Let's assume a default test user for now, or pass it from client if needed.
    // The prompt says "Pass contextId and any server props to the client."
    const userId = DEMO_USER_ID;

    // Fetch initial messages if needed (optional)
    // const { data: messages } = await supabaseAdmin...

    return (
        <div className="h-full">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading chat...</div>}>
                <ChatClient contextId={contextId} userId={userId} />
            </Suspense>
        </div>
    );
}
