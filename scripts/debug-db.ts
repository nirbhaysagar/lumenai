import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manual Env Loading
function loadEnv(filename: string) {
    const filePath = path.resolve(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnv('.env.local');
loadEnv('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? 'Found' : 'Missing');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Found' : 'Missing');

async function debugDB() {
    console.log('🔍 Debugging DB State...');

    // 1. Check Captures
    const { data: captures } = await supabaseAdmin
        .from('captures')
        .select('id, title, ingest_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\nRecent Captures:');
    captures?.forEach(c => console.log(`- [${c.ingest_status}] ${c.title} (${c.id})`));

    if (captures && captures.length > 0) {
        const captureId = captures[0].id;
        console.log(`\nChecking Capture: ${captureId}`);

        // 2. Check Chunks
        const { data: chunks } = await supabaseAdmin
            .from('chunks')
            .select('id, content')
            .eq('capture_id', captureId);

        console.log(`\nChunks found: ${chunks?.length}`);
        if (chunks && chunks.length > 0) {
            const chunkId = chunks[0].id;

            // 3. Check Vectors
            const { data: vectors } = await supabaseAdmin
                .from('chunk_vectors')
                .select('id')
                .eq('chunk_id', chunkId);
            console.log(`Vectors found for first chunk: ${vectors?.length}`);

            // 4. Check Canonical Map
            const { data: map } = await supabaseAdmin
                .from('canonical_map')
                .select('canonical_id')
                .eq('chunk_id', chunkId);
            console.log(`Canonical Map entries for first chunk: ${map?.length}`);

            if (map && map.length > 0) {
                const canonicalId = map[0].canonical_id;
                // 5. Check Canonical Chunk
                const { data: canonical } = await supabaseAdmin
                    .from('canonical_chunks')
                    .select('id')
                    .eq('id', canonicalId);
                console.log(`Canonical Chunk found: ${canonical?.length}`);
            }
        }

        // 6. Check Summaries
        const { data: summaries } = await supabaseAdmin
            .from('summaries')
            .select('id')
            .eq('target_id', captureId)
            .eq('target_type', 'capture');
        console.log(`Summaries found for capture: ${summaries?.length}`);
    }

    // 7. Check Concepts
    const { count: conceptCount } = await supabaseAdmin
        .from('concepts')
        .select('*', { count: 'exact', head: true });
    console.log(`\nTotal Concepts in DB: ${conceptCount}`);

    if (captures && captures.length > 0) {
        const captureId = captures[0].id;
        const { data: chunks } = await supabaseAdmin.from('chunks').select('id').eq('capture_id', captureId);
    }
    // 8. Check Tables
    const tables = ['canonical_chunks', 'canonical_map', 'chunk_vectors', 'concepts', 'concept_relations', 'concept_chunks'];
    for (const table of tables) {
        try {
            const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.error(`❌ Table '${table}' check failed:`, error.message);
            } else {
                console.log(`✅ Table '${table}' exists. Count: ${count}`);
            }
        } catch (e) {
            console.error(`❌ Exception checking '${table}':`, e);
        }
    }

    // 9. Try Insert
    try {
        const { error } = await supabaseAdmin.from('canonical_chunks').insert({ canonical_text: 'test' });
        if (error) {
            console.error('❌ Insert into canonical_chunks failed:', error.message, error.code);
        } else {
            console.log('✅ Insert into canonical_chunks succeeded');
        }
    } catch (e) {
        console.error('❌ Exception inserting:', e);
    }
    // 10. Check Concepts Table Access
    try {
        const { data, error } = await supabaseAdmin.from('concepts').select('*').limit(5);
        if (error) {
            console.error('❌ Concepts table access failed:', error.message, error.code);
        } else {
            console.log(`✅ Concepts table accessible. Count: ${data?.length}`);
        }
    } catch (e) {
        console.error('❌ Exception accessing concepts:', e);
    }
    // 11. Check Canonical Map
    try {
        const { count, error } = await supabaseAdmin.from('canonical_map').select('*', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Canonical map check failed:', error.message);
        } else {
            console.log(`✅ Canonical map entries: ${count}`);
        }

        // Try manual insert if empty
        if (count === 0) {
            // Get a chunk and a canonical chunk
            const { data: chunks } = await supabaseAdmin.from('chunks').select('id').limit(1);
            const { data: canonicals } = await supabaseAdmin.from('canonical_chunks').select('id').limit(1);

            if (chunks && chunks.length > 0 && canonicals && canonicals.length > 0) {
                console.log(`Attempting manual insert into canonical_map with chunk ${chunks[0].id} and canonical ${canonicals[0].id}`);
                const { error: insertError } = await supabaseAdmin.from('canonical_map').insert({
                    chunk_id: chunks[0].id,
                    canonical_id: canonicals[0].id,
                    similarity_score: 0.99
                });
                if (insertError) {
                    console.error('❌ Manual insert into canonical_map failed:', insertError.message, insertError.details);
                } else {
                    console.log('✅ Manual insert into canonical_map succeeded');
                }
            } else {
                console.log('Skipping manual insert: missing chunks or canonicals');
            }
        }

    } catch (e) {
        console.error('❌ Exception checking canonical map:', e);
    }
}













debugDB();
