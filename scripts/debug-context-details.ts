
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const contextId = '61e203e2-30fb-4c1a-8ae8-3f938b2b96a3';

async function debugContextDetails() {
    console.log(`Fetching details for context: ${contextId}`);

    // 1. Fetch Context
    const { data: context, error: contextError } = await supabase
        .from('contexts')
        .select('*')
        .eq('id', contextId)
        .single();

    if (contextError) {
        console.error('Context Fetch Error:', contextError);
        return;
    }
    console.log('Context found:', context.name);

    // 2. Fetch Chunks
    console.log('Fetching chunks...');
    const { data: contextChunks, error: chunksError } = await supabase
        .from('context_chunks')
        .select('chunk_id, chunks(*)')
        .eq('context_id', contextId);

    if (chunksError) {
        console.error('Chunks Fetch Error:', chunksError);
    } else {
        console.log(`Chunks found: ${contextChunks.length}`);
    }

    // 3. Fetch Summaries
    console.log('Fetching summaries...');
    const { data: summaries, error: summariesError } = await supabase
        .from('summaries')
        .select('*')
        .eq('context_id', contextId)
        .order('created_at', { ascending: false });

    if (summariesError) {
        console.error('Summaries Fetch Error:', summariesError);
    } else {
        console.log(`Summaries found: ${summaries.length}`);
    }
}

debugContextDetails();
