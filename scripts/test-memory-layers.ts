
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
// Imports moved to main
// import { ingestQueue, dedupQueue } from '../src/lib/queue';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env.local:', result.error);
}

console.log('REDIS_URL set:', !!process.env.REDIS_URL);
if (process.env.REDIS_URL) {
    console.log('REDIS_URL starts with:', process.env.REDIS_URL.substring(0, 10) + '...');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('🚀 Starting Multi-Layer Memory Verification...');

    // 1. Create a test user if needed (or use existing)
    // For simplicity, we'll assume a user exists or we can use a hardcoded UUID if known, 
    // but better to fetch one.
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
    if (userError || !users || users.length === 0) {
        console.error('❌ No users found. Please create a user first.');
        process.exit(1);
    }
    const userId = users[0].id;
    console.log(`👤 Using User ID: ${userId}`);

    // Import queues after env is loaded
    const { ingestQueue, dedupQueue } = await import('../src/lib/queue');

    // 2. Ingest Sample Text (Original)
    const content = `
    The Project Apollo was a series of human spaceflight missions undertaken by NASA. 
    The goal was to land the first humans on the Moon. 
    Neil Armstrong and Buzz Aldrin walked on the lunar surface on July 20, 1969.
    The mission was a success for the United States.
    `;

    console.log('📥 Ingesting Original Capture...');
    const { data: capture1, error: capError1 } = await supabase.from('captures').insert({
        user_id: userId,
        type: 'text',
        title: 'Apollo Mission (Original)',
        raw_text: content,
        ingest_status: 'pending'
    }).select().single();

    if (capError1) throw capError1;

    await ingestQueue.add('process_ingest', {
        captureId: capture1.id,
        userId,
        type: 'text',
        text: content,
        title: 'Apollo Mission (Original)'
    });
    console.log(`✅ Queued Ingest Job for Capture 1: ${capture1.id}`);

    // 3. Ingest Duplicate Text
    console.log('📥 Ingesting Duplicate Capture...');
    const { data: capture2, error: capError2 } = await supabase.from('captures').insert({
        user_id: userId,
        type: 'text',
        title: 'Apollo Mission (Duplicate)',
        raw_text: content, // Exact duplicate
        ingest_status: 'pending'
    }).select().single();

    if (capError2) throw capError2;

    await ingestQueue.add('process_ingest', {
        captureId: capture2.id,
        userId,
        type: 'text',
        text: content,
        title: 'Apollo Mission (Duplicate)'
    });
    console.log(`✅ Queued Ingest Job for Capture 2: ${capture2.id}`);

    // 4. Wait for Ingestion (Simple sleep)
    console.log('⏳ Waiting for Ingestion (10s)...');
    await new Promise(r => setTimeout(r, 10000));

    // 5. Trigger Dedup
    console.log('🔄 Triggering Dedup Worker...');
    await dedupQueue.add('dedup_job', { userId });

    // 6. Wait for Dedup & Graph (Simple sleep)
    console.log('⏳ Waiting for Dedup & Graph Extraction (30s)...');
    await new Promise(r => setTimeout(r, 30000));

    // 7. Verify Results
    console.log('🔍 Verifying Results...');

    // Check Canonical Map
    const { data: mapEntries, error: mapError } = await supabase
        .from('canonical_map')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (mapError) console.error('Error fetching canonical map:', mapError);

    if (mapEntries && mapEntries.length > 0) {
        console.log(`✅ Found ${mapEntries.length} canonical map entries.`);
        console.log('Keys:', Object.keys(mapEntries[0]));
        const canonicalId = mapEntries[0].canonical_chunk_id;
        console.log(`   Canonical ID: ${canonicalId}`);

        // Check Canonical Chunk
        const { data: canonicalChunk, error: chunkError } = await supabase
            .from('canonical_chunks') // Assuming table name is canonical_chunks, wait, let's check schema
            // In 008_backend_blueprint_schema.sql it is canonical_chunks.
            // But wait, in dedup.worker.ts, it inserts into 'chunks' with metadata type='canonical'!
            // Let's check dedup.worker.ts again.
            .select('*')
            .eq('id', canonicalId)
            .single();

        // Wait, dedup.worker.ts line 80:
        // .from('chunks')
        // .insert({ ... type: 'canonical' ... })

        // But canonical_map references canonical_chunks?
        // In 008_backend_blueprint_schema.sql:
        // canonical_id UUID REFERENCES canonical_chunks(id)

        // This is a DISCREPANCY!
        // dedup.worker.ts inserts into 'chunks', but canonical_map references 'canonical_chunks'.
        // If dedup.worker.ts inserts into 'chunks', then canonical_map insert will FAIL if it references 'canonical_chunks' and the ID is not there.

        // Let's check dedup.worker.ts line 110:
        // .from('canonical_map')
        // .insert({ ..., canonical_chunk_id: canonicalChunk.id })

        // And 008_backend_blueprint_schema.sql:
        // canonical_id UUID REFERENCES canonical_chunks(id)

        // If dedup worker inserts into 'chunks', but canonical_map expects 'canonical_chunks', this will fail foreign key constraint!
        // UNLESS 'canonical_chunks' is a view? Or I misread the schema or worker.

        // Let's re-read dedup.worker.ts and 008_backend_blueprint_schema.sql carefully.


        // Check Concepts
        const { data: concepts, error: conceptError } = await supabase
            .from('concept_chunks')
            .select('concepts(*)')
            .eq('chunk_id', canonicalId);

        if (conceptError) console.error('Error fetching concepts:', conceptError);

        if (concepts && concepts.length > 0) {
            console.log(`✅ Found ${concepts.length} concepts linked to canonical chunk.`);
            concepts.forEach((c: any) => console.log(`   - ${c.concepts.name} (${c.concepts.category})`));
        } else {
            console.warn('⚠️ No concepts found for canonical chunk yet (might still be processing).');
        }

    } else {
        console.warn('⚠️ No canonical map entries found. Dedup might not have run or found duplicates.');
    }

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
