import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: contextId } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Concepts
        // If contextId is provided, we should ideally filter by concepts linked to chunks in that context
        // For now, we'll fetch all concepts for the user to show the "Global Brain" if contextId is 'all'
        // Or filter if we had a direct link. Since `concept_chunks` links concepts to chunks, and chunks belong to contexts...

        let query = supabaseAdmin
            .from('concepts')
            .select('id, name, category, description')
            .eq('user_id', userId)
            .limit(50); // Limit for performance

        // TODO: Add context filtering logic here when needed
        // For MVP, showing the top 50 concepts is a good start for the "Knowledge Graph"

        const { data: concepts, error: conceptsError } = await query;

        if (conceptsError) throw conceptsError;

        if (!concepts || concepts.length === 0) {
            return NextResponse.json({ nodes: [], links: [] });
        }

        const conceptIds = concepts.map(c => c.id);

        // 2. Fetch Relations between these concepts
        const { data: relations, error: relationsError } = await supabaseAdmin
            .from('concept_relations')
            .select('source_concept_id, target_concept_id, relation_type')
            .in('source_concept_id', conceptIds)
            .in('target_concept_id', conceptIds);

        if (relationsError) throw relationsError;

        // 3. Format for Frontend
        const nodes = concepts.map(c => ({
            id: c.id,
            label: c.name,
            group: c.category || 'concept',
            description: c.description
        }));

        const links = relations?.map(r => ({
            source: r.source_concept_id,
            target: r.target_concept_id,
            label: r.relation_type
        })) || [];

        return NextResponse.json({ nodes, links });

    } catch (error) {
        console.error('Graph fetch failed', error);
        return NextResponse.json({ error: 'Failed to fetch graph' }, { status: 500 });
    }
}
