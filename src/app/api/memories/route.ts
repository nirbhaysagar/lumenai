import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const teamId = searchParams.get('teamId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        // 1. Get Contexts and Captures
        // Logic: 
        // If teamId: Get captures belonging to that team.
        // If NO teamId: Get captures belonging to user (Personal). 
        // Note: We might want to handle "All" view later.

        let contextsQuery = supabaseAdmin.from('contexts').select('id');
        let capturesQuery = supabaseAdmin.from('captures').select('id');

        if (teamId) {
            // Verify membership (using admin for now, but ideally RLS)
            const { data: member } = await supabaseAdmin
                .from('team_members')
                .select('role')
                .eq('team_id', teamId)
                .eq('user_id', userId)
                .single();

            if (!member) return NextResponse.json({ error: 'Access denied to team' }, { status: 403 });

            // Contexts don't have team_id yet in my plan (oops, only captures).
            // So for now, we only return team CAPTURES. 
            // Or we assume contexts are personal only?
            // "Shared Workspace" plan didn't explicitly add team_id to contexts.
            // Let's assume contexts are personal-only for now, so [] for team view.
            contextsQuery = contextsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Return empty

            capturesQuery = capturesQuery.eq('team_id', teamId);
        } else {
            // Personal: user_id = userId AND team_id IS NULL
            contextsQuery = contextsQuery.eq('user_id', userId);
            capturesQuery = capturesQuery.eq('user_id', userId).is('team_id', null);
        }

        const [{ data: contexts }, { data: captures }] = await Promise.all([
            contextsQuery,
            capturesQuery
        ]);

        const contextIds = contexts?.map(c => c.id) || [];
        const captureIds = captures?.map(c => c.id) || [];

        if (contextIds.length === 0 && captureIds.length === 0) {
            return NextResponse.json({ memories: [] });
        }

        let query = supabaseAdmin
            .from('summaries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        // Construct OR filter: context_id.in.X,target_id.in.Y (assuming target_id can be capture_id)
        // Since we don't have capture_id column, we check target_id if target_type is capture
        const filters = [];
        if (contextIds.length > 0) filters.push(`context_id.in.(${contextIds.join(',')})`);

        // For captures, we check if target_id is in captureIds AND target_type is 'capture'
        // But OR syntax with AND is tricky. 
        // Let's just fetch summaries for the user's contextIds and filter in memory if needed, 
        // or assume context_id covers most cases. 
        // Actually, summaries usually have a context_id (even if it's the default context).
        // If target_type is capture, target_id is the capture_id.

        if (captureIds.length > 0) {
            filters.push(`target_id.in.(${captureIds.join(',')})`);
        }

        if (filters.length > 0) {
            query = query.or(filters.join(','));
        }

        if (q) {
            query = query.ilike('content', `%${q}%`);
        }

        if (type && type !== 'all') {
            query = query.eq('target_type', type);
        }

        const { data: summaries, error } = await query;

        if (error) throw error;

        let filteredSummaries = summaries || [];

        // Manually fetch names for contexts and captures
        const contextIdsToFetch = new Set<string>();
        const captureIdsToFetch = new Set<string>();

        filteredSummaries.forEach((s: any) => {
            if (s.context_id) contextIdsToFetch.add(s.context_id);
            if (s.target_type === 'context' && s.target_id) contextIdsToFetch.add(s.target_id);
            if (s.target_type === 'capture' && s.target_id) captureIdsToFetch.add(s.target_id);
        });

        const [contextsRes, capturesRes] = await Promise.all([
            contextIdsToFetch.size > 0 ? supabaseAdmin.from('contexts').select('id, name').in('id', Array.from(contextIdsToFetch)) : { data: [] },
            captureIdsToFetch.size > 0 ? supabaseAdmin.from('captures').select('id, title').in('id', Array.from(captureIdsToFetch)) : { data: [] }
        ]);

        const contextMap = new Map(contextsRes.data?.map((c: any) => [c.id, c.name]) || []);
        const captureMap = new Map(capturesRes.data?.map((c: any) => [c.id, c.title]) || []);

        filteredSummaries = filteredSummaries.map((s: any) => ({
            ...s,
            contexts: s.context_id ? { name: contextMap.get(s.context_id) } : (s.target_type === 'context' ? { name: contextMap.get(s.target_id) } : null),
            captures: s.target_type === 'capture' ? { title: captureMap.get(s.target_id) } : null
        }));

        // Filter by tag if specified
        if (tag && tag !== 'all') {
            // Fetch chunks for each summary and filter by topics
            const summariesWithTags = await Promise.all(
                filteredSummaries.map(async (summary) => {
                    const { data: chunks } = await supabaseAdmin
                        .from('chunks')
                        .select('metadata')
                        .eq('capture_id', summary.capture_id)
                        .not('metadata->topics', 'is', null)
                        .limit(10);

                    // Check if any chunk has the tag
                    const hasTag = chunks?.some((chunk: any) => {
                        const topics = chunk.metadata?.topics;
                        return Array.isArray(topics) && topics.some((t: string) =>
                            t.toLowerCase().includes(tag.toLowerCase())
                        );
                    });

                    return hasTag ? summary : null;
                })
            );

            filteredSummaries = summariesWithTags.filter(s => s !== null);
        }

        // If search query is provided, also search in topics
        if (q) {
            const summariesWithTopicMatch = await Promise.all(
                filteredSummaries.map(async (summary) => {
                    const { data: chunks } = await supabaseAdmin
                        .from('chunks')
                        .select('metadata')
                        .eq('capture_id', summary.capture_id)
                        .not('metadata->topics', 'is', null)
                        .limit(10);

                    // Check if any chunk has matching topics
                    const hasMatchingTopic = chunks?.some((chunk: any) => {
                        const topics = chunk.metadata?.topics;
                        return Array.isArray(topics) && topics.some((t: string) =>
                            t.toLowerCase().includes(q.toLowerCase())
                        );
                    });

                    return { summary, hasMatchingTopic };
                })
            );

            // Prioritize summaries with matching topics but don't exclude others
            filteredSummaries = summariesWithTopicMatch
                .sort((a, b) => (b.hasMatchingTopic ? 1 : 0) - (a.hasMatchingTopic ? 1 : 0))
                .map(item => item.summary);
        }

        return NextResponse.json({ memories: filteredSummaries });
    } catch (error: any) {
        console.error('Failed to fetch memories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
