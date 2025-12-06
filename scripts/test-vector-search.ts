
import { supabaseAdmin } from '../src/lib/supabase';
import { generateEmbeddings } from '../src/lib/embeddings';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testVectorSearch() {
    console.log('Testing match_chunks RPC with Local Embeddings...');

    const userId = '356b3af3-1553-4bbc-844d-17b407b0de08'; // Hardcoded test user
    const query = 'test query';

    try {
        // Generate embedding using the SAME model as ingestion (Local)
        const queryEmbedding = await generateEmbeddings(query);

        console.log('Generated embedding length:', queryEmbedding.length);

        // Call RPC
        const { data, error } = await supabaseAdmin.rpc('match_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.1, // Lower threshold for testing
            match_count: 5,
            filter_user_id: userId,
            filter_context_id: null
        });

        if (error) {
            console.error('RPC Error:', error);
        } else {
            console.log('RPC Success! Found chunks:', data?.length);
            if (data && data.length > 0) {
                console.log('First chunk:', data[0].content.substring(0, 50) + '...');
                console.log('Similarity:', data[0].similarity);
            }
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

testVectorSearch();
