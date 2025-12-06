
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { DEMO_USER_ID } from '../src/lib/constants';

async function debugRAG() {
    const { supabaseAdmin } = await import('../src/lib/supabase');
    const { generateEmbeddings } = await import('../src/lib/embeddings');

    console.log('--- Debugging RAG Pipeline ---');
    const userId = DEMO_USER_ID;
    console.log(`User ID: ${userId}`);

    // 1. Check Chunks Count
    const { count, error: countError } = await supabaseAdmin
        .from('chunks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) {
        console.error('Error counting chunks:', JSON.stringify(countError, null, 2));
        // Proceed anyway since simple select worked
    } else {
        console.log(`Total Chunks for User: ${count}`);
    }
    console.log(`Total Chunks for User: ${count}`);

    if (count === 0) {
        console.warn('⚠️ No chunks found! Ingestion might be failing to create chunks.');
        return;
    }

    // 2. Inspect a few chunks
    const { data: chunks, error: fetchError } = await supabaseAdmin
        .from('chunks')
        .select('id, content, capture_id') // Removed embedding as it is in chunk_vectors
        .limit(3);

    if (fetchError) {
        console.error('Error fetching chunks:', fetchError);
        return;
    }

    console.log('Sample Chunks:');
    chunks?.forEach((c, i) => {
        const hasEmbedding = c.embedding && c.embedding.length > 0;
        console.log(`[${i}] ID: ${c.id}, Capture: ${c.capture_id}, Context: ${c.context_id}, Has Embedding: ${hasEmbedding}`);
        console.log(`    Content: ${c.content.substring(0, 50)}...`);
    });

    // 3. Test Vector Search
    const query = "What is whiplash?";
    console.log(`\nTesting Search Query: "${query}"`);

    try {
        const embedding = await generateEmbeddings(query);
        console.log('Generated embedding for query.');

        // Test Global Search
        console.log('--- Global Search (context_id: null) ---');
        const { data: globalResults, error: globalError } = await supabaseAdmin.rpc('match_chunks', {
            query_embedding: embedding,
            match_threshold: 0.1, // Lower threshold for debugging
            match_count: 5,
            filter_user_id: userId,
            filter_capture_id: null,
        });

        if (globalError) {
            console.error('Global search error:', globalError);
        } else {
            console.log(`Found ${globalResults?.length} results.`);
            globalResults?.forEach((r: any) => {
                console.log(`  - [${r.similarity.toFixed(4)}] ${r.content.substring(0, 50)}... (Capture: ${r.capture_id})`);
            });
        }

    } catch (e) {
        console.error('Error generating embedding or running search:', e);
    }
}

debugRAG();
