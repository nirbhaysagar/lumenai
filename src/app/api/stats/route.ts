import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { embeddingsQueue, dedupQueue, topicerQueue } from '@/lib/queue';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 1. Active Contexts
        const { count: activeContexts, error: contextError } = await supabaseAdmin
            .from('contexts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (contextError) throw contextError;

        // 2. Queued Jobs (Real Data)
        const [embeddingsCounts, dedupCounts, topicCounts] = await Promise.all([
            embeddingsQueue.getJobCounts('active', 'waiting'),
            dedupQueue.getJobCounts('active', 'waiting'),
            topicerQueue.getJobCounts('active', 'waiting')
        ]);

        const queuedJobs = embeddingsCounts.waiting + dedupCounts.waiting + topicCounts.waiting;

        // 3. Memory Counts by Layer
        // Correct query: Count chunks by layer for this user's captures
        const { data: chunks, error: chunksError } = await supabaseAdmin
            .from('chunks')
            .select('layer, captures!inner(user_id)')
            .eq('captures.user_id', userId);

        if (chunksError) throw chunksError;

        const memoryCounts = {
            raw: 0,
            canonical: 0,
            abstract: 0
        };

        chunks?.forEach((chunk: any) => {
            const layer = chunk.layer as keyof typeof memoryCounts;
            if (memoryCounts[layer] !== undefined) {
                memoryCounts[layer]++;
            }
        });

        // 4. Concept Count (Diversity)
        const { count: conceptsCount, error: conceptsError } = await supabaseAdmin
            .from('concepts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 5. Relations Count (Connectivity)
        const { count: relationsCount, error: relationsError } = await supabaseAdmin
            .from('concept_relations')
            .select('source_concept_id, concepts!inner(user_id)', { count: 'exact', head: true })
            .eq('concepts.user_id', userId);

        // 6. Calculate Radar Metrics (Normalized to 0-150 scale for the chart)
        const volumeScore = Math.min(150, Math.round(((chunks?.length || 0) / 50) * 100));
        const connectivityScore = Math.min(150, Math.round(((relationsCount || 0) / 50) * 100));
        const diversityScore = Math.min(150, Math.round(((conceptsCount || 0) / 20) * 100));

        // Freshness: Check last chunk time
        let freshnessScore = 50;
        if (chunks && chunks.length > 0) {
            const { data: latest } = await supabaseAdmin.from('captures').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
            if (latest) {
                const diffHours = (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);
                if (diffHours < 24) freshnessScore = 140;
                else if (diffHours < 72) freshnessScore = 100;
                else freshnessScore = 60;
            }
        }

        // Relevance: Ratio of Canonical+Abstract / Total
        const total = (memoryCounts.raw + memoryCounts.canonical + memoryCounts.abstract) || 1;
        const processed = memoryCounts.canonical + memoryCounts.abstract;
        const relevanceScore = Math.min(150, Math.round((processed / total) * 150));


        return NextResponse.json({
            activeContexts: activeContexts || 0,
            queuedJobs,
            memoryCounts: {
                ...memoryCounts,
                concepts: conceptsCount || 0
            },
            knowledgeGraph: [
                { subject: 'Volume', A: volumeScore, fullMark: 150 },
                { subject: 'Connectivity', A: connectivityScore, fullMark: 150 },
                { subject: 'Diversity', A: diversityScore, fullMark: 150 },
                { subject: 'Freshness', A: freshnessScore, fullMark: 150 },
                { subject: 'Relevance', A: relevanceScore, fullMark: 150 },
            ],

            queues: {
                embeddings: embeddingsCounts.active + embeddingsCounts.waiting,
                dedup: dedupCounts.active + dedupCounts.waiting,
                topic: topicCounts.active + topicCounts.waiting
            },
            systemHealth: 'operational'
        });

    } catch (error: any) {
        console.error('Stats API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
// Force rebuild
