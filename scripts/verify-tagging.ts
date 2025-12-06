import { supabaseAdmin } from '../src/lib/supabase';

/**
 * Script to verify the Auto-Tagging feature implementation
 * Tests:
 * 1. Check if chunks have topics in metadata
 * 2. Verify topicer worker has processed chunks
 * 3. Test tag aggregation logic
 */

async function verifyTagging() {
    console.log('🔍 Verifying Auto-Tagging Feature...\n');

    try {
        // 1. Check chunks with topics
        console.log('1️⃣  Checking chunks with topics...');
        const { data: chunksWithTopics, error: chunksError } = await supabaseAdmin
            .from('chunks')
            .select('id, content, metadata, created_at')
            .not('metadata->topics', 'is', null)
            .limit(5);

        if (chunksError) throw chunksError;

        console.log(`   ✅ Found ${chunksWithTopics?.length || 0} chunks with topics`);

        if (chunksWithTopics && chunksWithTopics.length > 0) {
            chunksWithTopics.forEach((chunk, idx) => {
                const topics = chunk.metadata?.topics;
                const importance = chunk.metadata?.importance;
                console.log(`   ${idx + 1}. Chunk ${chunk.id.substring(0, 8)}...`);
                console.log(`      Topics: ${topics?.join(', ') || 'none'}`);
                console.log(`      Importance: ${importance || 'N/A'}`);
            });
        } else {
            console.log('   ⚠️  No chunks with topics found. Topicer might not have run yet.\n');
        }

        // 2. Aggregate unique topics
        console.log('\n2️⃣  Aggregating unique topics...');
        const tagMap = new Map<string, number>();

        const { data: allChunksWithTopics } = await supabaseAdmin
            .from('chunks')
            .select('metadata')
            .not('metadata->topics', 'is', null)
            .limit(100);

        allChunksWithTopics?.forEach((chunk: any) => {
            const topics = chunk.metadata?.topics;
            if (Array.isArray(topics)) {
                topics.forEach((topic: string) => {
                    if (topic && typeof topic === 'string') {
                        tagMap.set(topic, (tagMap.get(topic) || 0) + 1);
                    }
                });
            }
        });

        const tags = Array.from(tagMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        console.log(`   ✅ Found ${tags.length} unique topics:`);
        tags.slice(0, 10).forEach((tag, idx) => {
            console.log(`   ${idx + 1}. "${tag.name}" - ${tag.count} occurrences`);
        });

        // 3. Check summaries (memories) that should show these tags
        console.log('\n3️⃣  Checking summaries (memories)...');
        const { data: summaries, error: summariesError } = await supabaseAdmin
            .from('summaries')
            .select('id, context_id, type, created_at')
            .limit(5);

        if (summariesError) throw summariesError;

        console.log(`   ✅ Found ${summaries?.length || 0} summaries/memories`);

        if (summaries && summaries.length > 0) {
            for (const summary of summaries) {
                const { data: contextChunks } = await supabaseAdmin
                    .from('chunks')
                    .select('metadata')
                    .eq('context_id', summary.context_id)
                    .not('metadata->topics', 'is', null)
                    .limit(5);

                const contextTopics = new Set<string>();
                contextChunks?.forEach((chunk: any) => {
                    const topics = chunk.metadata?.topics;
                    if (Array.isArray(topics)) {
                        topics.forEach((t: string) => contextTopics.add(t));
                    }
                });

                console.log(`   Memory ${summary.id.substring(0, 8)}... has ${contextTopics.size} topics: ${Array.from(contextTopics).slice(0, 3).join(', ')}`);
            }
        }

        console.log('\n✅ Verification complete!');
        console.log('\n📋 Next steps:');
        console.log('   1. Navigate to http://localhost:3000/memories');
        console.log('   2. Check if tags appear on Memory cards');
        console.log('   3. Open a Memory drawer to see full topic list');
        console.log('   4. Try filtering by a tag from the dropdown');

    } catch (error: any) {
        console.error('❌ Verification failed:', error.message);
        throw error;
    }
}

verifyTagging()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
