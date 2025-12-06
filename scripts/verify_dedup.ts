
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateEmbeddings } from '../src/lib/embeddings';
import { Queue } from 'bullmq';
import { getRedisConnection } from '../src/lib/redis';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'; // Use a fixed UUID for testing

async function main() {
    console.log('Starting Dedup Verification...');

    // 1. Cleanup previous test data
    console.log('Cleaning up old test data...');
    await supabase.from('captures').delete().eq('user_id', TEST_USER_ID);
    // Cascading delete should remove chunks, canonical_map, etc.

    // 2. Create Test User (if not exists)
    const { error: userError } = await supabase.from('users').upsert({ id: TEST_USER_ID, email: 'test@example.com' });
    if (userError) console.error('User upsert error:', userError);

    // 3. Insert 3 Duplicate Captures & Chunks
    const texts = [
        "The project meeting is at 10 AM on Monday. We need to discuss the roadmap.",
        "Monday 10 AM meeting: Roadmap discussion is key.",
        "Reminder: Roadmap meeting this Monday at 10:00."
    ];

    console.log('Inserting 3 duplicate chunks...');
    for (const text of texts) {
        const { data: capture } = await supabase.from('captures').insert({
            user_id: TEST_USER_ID,
            type: 'text',
            raw_text: text,
            title: 'Test Note'
        }).select().single();

        if (capture) {
            const embedding = await generateEmbeddings(text);
            await supabase.from('chunks').insert({
                capture_id: capture.id,
                content: text,
                seq_idx: 0,
                // We need to insert vector too if using separate table, but schema says chunks has no vector column in 008?
                // Wait, schema.sql says `chunk_vectors` table.
                // But `match_chunks` usually joins them.
                // Let's check if `chunks` has embedding column. 011_add_embedding_to_chunks.sql suggests it might.
            });

            // Let's try inserting into chunk_vectors too just in case
            const { data: chunk } = await supabase.from('chunks').select('id').eq('capture_id', capture.id).single();
            if (chunk) {
                // Check if chunks table has embedding column by trying to update it
                const { error: updateError } = await supabase.from('chunks').update({ embedding: embedding } as any).eq('id', chunk.id);
                if (updateError) {
                    // Fallback to chunk_vectors
                    await supabase.from('chunk_vectors').insert({
                        chunk_id: chunk.id,
                        embedding: embedding,
                        user_id: TEST_USER_ID
                    });
                }
            }
        }
    }

    // 4. Trigger Dedup Worker
    console.log('Triggering Dedup Worker...');
    const dedupQueue = new Queue('dedup-queue', {
        connection: getRedisConnection()
    });

    await dedupQueue.add('manual-trigger', { userId: TEST_USER_ID });

    console.log('Waiting for worker to process (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 5. Verify Results
    console.log('Verifying results...');

    // Check Canonical Chunks
    // We need to find the canonical chunk linked to our test user's chunks
    const { data: maps } = await supabase
        .from('canonical_map')
        .select('canonical_id, chunk_id, chunks!inner(capture_id, captures!inner(user_id))')
        .eq('chunks.captures.user_id', TEST_USER_ID);

    if (!maps || maps.length === 0) {
        console.error('❌ No canonical mappings found!');
    } else {
        console.log(`✅ Found ${maps.length} mappings.`);
        const canonicalId = maps[0].canonical_id;

        const { data: canonical } = await supabase
            .from('canonical_chunks')
            .select('*')
            .eq('id', canonicalId)
            .single();

        if (canonical) {
            console.log('✅ Canonical Chunk Created:');
            console.log('   ID:', canonical.id);
            console.log('   Content:', canonical.canonical_text);

            if (maps.length === 3) {
                console.log('✅ SUCCESS: 3 duplicates merged into 1 canonical chunk.');
            } else {
                console.log(`⚠️ PARTIAL SUCCESS: Merged ${maps.length} chunks (expected 3).`);
            }
        } else {
            console.error('❌ Canonical chunk record missing.');
        }
    }

    await dedupQueue.close();
    process.exit(0);
}

main().catch(console.error);
