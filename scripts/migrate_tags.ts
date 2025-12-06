import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTags() {
    console.log('🚀 Starting Tag Migration...');

    let page = 0;
    const pageSize = 100;
    let totalProcessed = 0;

    while (true) {
        const { data: chunks, error } = await supabase
            .from('chunks')
            .select('id, metadata')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching chunks:', error);
            break;
        }

        if (!chunks || chunks.length === 0) {
            break;
        }

        console.log(`Processing batch ${page + 1} (${chunks.length} chunks)...`);

        for (const chunk of chunks) {
            const topics = chunk.metadata?.topics;
            if (Array.isArray(topics) && topics.length > 0) {
                for (const topic of topics) {
                    // 1. Upsert Tag
                    const { data: tagData, error: tagError } = await supabase
                        .from('tags')
                        .upsert({ name: topic }, { onConflict: 'name' })
                        .select('id')
                        .single();

                    if (tagError) {
                        console.error(`Failed to upsert tag "${topic}":`, tagError.message);
                        continue;
                    }

                    // 2. Link Chunk
                    if (tagData) {
                        const { error: linkError } = await supabase
                            .from('chunk_tags')
                            .insert({ chunk_id: chunk.id, tag_id: tagData.id })
                            .select()
                            .maybeSingle();

                        if (linkError && linkError.code !== '23505') {
                            console.error(`Failed to link tag "${topic}" to chunk ${chunk.id}:`, linkError.message);
                        }
                    }
                }
            }
        }

        totalProcessed += chunks.length;
        page++;
    }

    console.log(`✅ Migration Complete. Processed ${totalProcessed} chunks.`);
}

migrateTags().catch(console.error);
