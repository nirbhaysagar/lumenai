
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCapture() {
    console.log('--- Verifying Latest Capture ---');

    // Get latest capture
    const { data: captures, error: captureError } = await supabase
        .from('captures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (captureError) {
        console.error('Error fetching capture:', captureError);
        return;
    }

    if (!captures || captures.length === 0) {
        console.log('No captures found.');
        return;
    }

    const capture = captures[0];
    console.log('Latest Capture:', {
        id: capture.id,
        title: capture.title,
        type: capture.type,
        source_url: capture.source_url,
        created_at: capture.created_at
    });

    // Check chunks for this capture
    const { count, error: countError } = await supabase
        .from('chunks')
        .select('*', { count: 'exact', head: true })
        .eq('capture_id', capture.id);

    if (countError) {
        console.error('Error counting chunks:', countError);
    } else {
        console.log(`Found ${count} chunks for capture ${capture.id}`);
    }

    // Test match_chunks RPC
    console.log('\n--- Testing match_chunks RPC ---');
    const { data: rpcData, error: rpcError } = await supabase.rpc('match_chunks', {
        query_embedding: Array(1536).fill(0.01), // Dummy embedding
        match_threshold: 0.0, // Low threshold to match anything
        match_count: 5,
        filter_user_id: capture.user_id,
        filter_capture_id: capture.id
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
    } else {
        console.log(`RPC returned ${rpcData?.length} chunks`);
        if (rpcData && rpcData.length > 0) {
            console.log('First match:', {
                id: rpcData[0].id,
                similarity: rpcData[0].similarity,
                content_preview: rpcData[0].content.substring(0, 50) + '...'
            });
        }
    }
}

verifyCapture();
