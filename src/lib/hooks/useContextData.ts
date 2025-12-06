import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useContextData(contextId: string) {
    const [context, setContext] = useState<any>(null);
    const [chunks, setChunks] = useState<any[]>([]);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContext = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/contexts/${contextId}`);
            const data = await res.json();
            if (data.context) {
                setContext(data.context);
                setChunks(data.chunks || []);
                setSummaries(data.summaries || []);
            } else {
                setError('Context not found');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load context');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contextId) fetchContext();
    }, [contextId]);

    return { context, chunks, summaries, loading, error, refetch: fetchContext };
}
