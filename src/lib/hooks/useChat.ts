import { useEffect } from 'react';
import { useChat as useVercelChat } from 'ai/react';
import { toast } from 'sonner';

export function useChat(contextId: string, userId: string, captureId?: string | null) {
    const {
        messages,
        setMessages,
        input,
        setInput,
        handleInputChange,
        handleSubmit,
        isLoading,
        stop,
        append
    } = useVercelChat({
        api: '/api/chat',
        body: {
            contextId,
            userId,
            captureId
        },
        onError: (error) => {
            console.error('Chat error:', error);
            toast.error('Failed to send message', { description: error.message });
        },
        onFinish: (message) => {
            // Optional: Handle finish
        }
    });

    // Fetch chat history on mount or when context/capture changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!userId) return;

            try {
                const params = new URLSearchParams({
                    userId,
                    contextId: contextId || 'default',
                });

                if (captureId) {
                    params.append('captureId', captureId);
                }

                const res = await fetch(`/api/chat?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch history');

                const history = await res.json();
                if (Array.isArray(history)) {
                    // Map DB messages to UI messages if needed, or assume they match
                    // DB: { id, role, content, created_at, ... }
                    // UI: { id, role, content, ... }
                    setMessages(history);
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
                // Don't toast here to avoid annoying popups on load
            }
        };

        fetchHistory();
    }, [contextId, userId, captureId, setMessages]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        // We need to manually call handleSubmit-like logic if we want to send a specific string
        // But useVercelChat's append is better for programmatic sending
        await append({
            role: 'user',
            content,
        });
        setInput('');
    };

    const insertMemory = (text: string) => {
        setInput(prev => prev + (prev ? '\n\n' : '') + `> ${text}\n\n`);
    };

    return {
        messages,
        setMessages,
        input,
        setInput, // This might need to be adapted if ChatPanel uses it directly
        isLoading,
        sendMessage, // Adapter
        stop,
        insertMemory
    };
}
