import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const q = searchParams.get('q');
    const limit = 5;

    if (!userId || !q) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = {
            contexts: [],
            captures: [],
            memories: [],
            tags: [],
            tasks: []
        };

        // 1. Search Contexts
        const { data: contexts } = await supabaseAdmin
            .from('contexts')
            .select('id, name, description')
            .eq('user_id', userId)
            .ilike('name', `%${q}%`)
            .limit(limit);

        if (contexts) results.contexts = contexts as any;

        // 2. Search Captures
        const { data: captures } = await supabaseAdmin
            .from('captures')
            .select('id, title, type, created_at')
            .eq('user_id', userId)
            .ilike('title', `%${q}%`)
            .limit(limit);

        if (captures) results.captures = captures as any;

        // 3. Search Memories (Summaries)
        // We search the content or summary text
        const { data: memories } = await supabaseAdmin
            .from('summaries')
            .select('id, content, created_at')
            .eq('user_id', userId)
            .ilike('content', `%${q}%`) // This might be slow on large text, but fine for MVP
            .limit(limit);

        if (memories) {
            results.memories = memories.map((m: any) => ({
                ...m,
                // Extract a snippet if content is JSON or long string
                snippet: typeof m.content === 'string'
                    ? (m.content.startsWith('{') ? JSON.parse(m.content).summary : m.content).substring(0, 100) + '...'
                    : 'Memory'
            })) as any;
        }

        // 4. Search Tags
        const { data: tags } = await supabaseAdmin
            .from('tags')
            .select('id, name')
            .ilike('name', `%${q}%`)
            .limit(limit);

        if (tags) results.tags = tags as any;

        // 5. Search Tasks
        const { data: tasks } = await supabaseAdmin
            .from('tasks')
            .select('id, content, status, priority')
            .eq('user_id', userId)
            .ilike('content', `%${q}%`)
            .limit(limit);

        if (tasks) results.tasks = tasks as any;

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
