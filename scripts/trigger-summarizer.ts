import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
// import { processSummarizerJob } from '../src/workers/summarizer.worker';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function triggerSummarizer() {
    console.log('🚀 Manually Triggering Summarizer...');

    // Get a recent capture
    const { data: captures } = await supabaseAdmin
        .from('captures')
        .select('id, user_id')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!captures || captures.length === 0) {
        console.error('❌ No captures found');
        return;
    }

    const capture = captures[0];
    console.log(`Using capture: ${capture.id}`);

    // Get chunks for this capture
    const { data: chunks } = await supabaseAdmin
        .from('chunks')
        .select('id')
        .eq('capture_id', capture.id);

    if (!chunks || chunks.length === 0) {
        console.error('❌ No chunks found for capture');
        return;
    }

    const chunkIds = chunks.map(c => c.id);
    console.log(`Found ${chunkIds.length} chunks`);

    // Mock Job
    const job = {
        id: 'manual-trigger-' + Date.now(),
        data: {
            chunkIds,
            userId: capture.user_id,
            captureId: capture.id
        }
    };

    try {
        const { processSummarizerJob } = await import('../src/workers/summarizer.worker');
        await processSummarizerJob(job as any);
        console.log('✅ Summarizer job finished successfully');
    } catch (error: any) {
        console.error('❌ Summarizer job failed:', error.message);
        console.error(error.stack);
        if (error.details) console.error('Details:', error.details);
        if (error.hint) console.error('Hint:', error.hint);
    }
}

triggerSummarizer();
