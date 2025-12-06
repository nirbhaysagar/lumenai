import { useState, useEffect, useCallback } from 'react';

export function useMemories(contextId: string) {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMemories = useCallback(async () => {
        if (!contextId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            // Add filters to params if API supports it

            const res = await fetch(`/api/contexts/${contextId}/chunks?${params.toString()}`);
            const data = await res.json();
            if (data.chunks) {
                setMemories(data.chunks);
            }
        } catch (error) {
            console.error('Failed to fetch memories', error);
        } finally {
            setLoading(false);
        }
    }, [contextId, searchQuery]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchMemories, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [fetchMemories]);

    const toggleFilter = (filter: string) => {
        setFilters(prev =>
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    return {
        memories,
        loading,
        filters,
        toggleFilter,
        searchQuery,
        setSearchQuery,
        refetch: fetchMemories
    };
}
