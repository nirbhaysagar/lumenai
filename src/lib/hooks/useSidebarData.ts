import { useState, useEffect } from 'react';

export function useSidebarData(contextId: string) {
    const [summary, setSummary] = useState<string | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [summaryRes, tasksRes] = await Promise.all([
                fetch(`/api/contexts/${contextId}/summary`),
                fetch(`/api/contexts/${contextId}/tasks`)
            ]);

            const summaryData = await summaryRes.json();
            const tasksData = await tasksRes.json();

            if (summaryData.summary) setSummary(summaryData.summary);
            if (tasksData.tasks) setTasks(tasksData.tasks);

        } catch (error) {
            console.error('Failed to fetch sidebar data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contextId) fetchData();
    }, [contextId]);

    return { summary, tasks, loading, refetch: fetchData };
}
