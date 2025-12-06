import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        // 1. Fetch Concepts (Nodes)
        const { data: concepts, error: conceptsError } = await supabaseAdmin
            .from('concepts')
            .select('id, name, category, description')
            .eq('user_id', userId);

        if (conceptsError) throw conceptsError;

        const nodes = concepts?.map(c => ({
            id: c.id,
            label: c.name,
            type: c.category || 'concept',
            val: 10, // Default size
            description: c.description
        })) || [];

        // 2. Fetch Relations (Edges)
        // We fetch relations where the source is one of our concepts.
        // Since concepts are user-scoped, this should retrieve the relevant subgraph.
        // 2. Fetch Relations (Edges)
        let edges: any[] = [];
        if (nodes.length > 0) {
            const conceptIds = nodes.map(n => n.id);
            const { data: relations, error: relationsError } = await supabaseAdmin
                .from('concept_relations')
                .select('source_concept_id, target_concept_id, relation_type')
                .in('source_concept_id', conceptIds); // Fetch outgoing edges from our nodes

            if (!relationsError && relations) {
                edges = relations.map(r => ({
                    source: r.source_concept_id,
                    target: r.target_concept_id,
                    label: r.relation_type
                }));
            }
        }

        if (nodes.length === 0) {
            // Mock Cinema Graph as requested
            nodes.push(
                { id: 'm1', label: 'Christopher Nolan', type: 'Person', val: 15, description: 'Film Director' },
                { id: 'm2', label: 'Inception', type: 'Movie', val: 12, description: 'Sci-Fi Action Film' },
                { id: 'm3', label: 'Interstellar', type: 'Movie', val: 12, description: 'Space Epic' },
                { id: 'm4', label: 'Hans Zimmer', type: 'Person', val: 10, description: 'Composer' },
                { id: 'm5', label: 'Sci-Fi', type: 'Genre', val: 8, description: 'Science Fiction' },
                { id: 'm6', label: 'Leonardo DiCaprio', type: 'Person', val: 10, description: 'Actor' }
            );

            edges.push(
                { source: 'm1', target: 'm2', label: 'DIRECTED' },
                { source: 'm1', target: 'm3', label: 'DIRECTED' },
                { source: 'm4', target: 'm2', label: 'COMPOSED_FOR' },
                { source: 'm4', target: 'm3', label: 'COMPOSED_FOR' },
                { source: 'm2', target: 'm5', label: 'HAS_GENRE' },
                { source: 'm3', target: 'm5', label: 'HAS_GENRE' },
                { source: 'm6', target: 'm2', label: 'ACTED_IN' }
            );
        }

        return NextResponse.json({ nodes, edges });
    } catch (error: any) {
        console.error('Failed to fetch graph:', error);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
        console.error('Error Hint:', error.hint);
        console.error('Error Code:', error.code);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
