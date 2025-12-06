
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { DEMO_USER_ID } from '../src/lib/constants';

async function testSummaryGeneration() {
    const { supabaseAdmin } = await import('../src/lib/supabase');
    console.log('--- Testing Summary Generation ---');

    // 1. Create a dummy context
    const contextName = `Test Context ${Date.now()}`;
    const { data: context, error: contextError } = await supabaseAdmin
        .from('contexts')
        .insert({
            user_id: DEMO_USER_ID,
            name: contextName,
            description: 'A test context for summary generation',
        })
        .select()
        .single();

    if (contextError) {
        console.error('Failed to create context:', contextError);
        return;
    }
    console.log(`Created context: ${context.id}`);

    // 2. Create a dummy chunk linked to this context
    // First create a capture, then a chunk, then link it.
    // Or just insert into context_chunks if we have a chunk.
    // Let's create a chunk directly (if RLS allows, or use admin).

    // We need a capture first usually due to FK, but let's see schema.
    // Assuming we need a capture.
    const { data: capture } = await supabaseAdmin
        .from('captures')
        .insert({
            user_id: DEMO_USER_ID,
            type: 'text',
            title: 'Test Capture for Summary',
            raw_text: 'Lumen is an AI-powered second brain. It helps you capture, organize, and recall information. Key features include ingestion of various file types, vector search for semantic retrieval, and a graph view for connecting concepts. The goal is to augment human intelligence by surfacing relevant memories when needed.',
            ingest_status: 'processed'
        })
        .select()
        .single();

    if (!capture) {
        console.error('Failed to create capture');
        return;
    }

    const { data: chunk } = await supabaseAdmin
        .from('chunks')
        .insert({
            capture_id: capture.id,
            content: capture.raw_text,
            seq_idx: 0,
            token_count: 50
        })
        .select()
        .single();

    if (!chunk) {
        console.error('Failed to create chunk');
        return;
    }

    // Link chunk to context
    await supabaseAdmin
        .from('context_chunks')
        .insert({
            context_id: context.id,
            chunk_id: chunk.id
        });

    console.log('Linked chunk to context.');

    // 3. Call Summarize API
    console.log('Calling Summarize API...');
    const res = await fetch('http://localhost:3000/api/agent/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: DEMO_USER_ID,
            contextId: context.id
        })
    });

    const data = await res.json();
    console.log('API Response:', res.status, data);

    if (!data.success) {
        console.error('API failed');
        return;
    }

    // 4. Poll for Summary
    console.log('Polling for summary...');
    let attempts = 0;
    const maxAttempts = 20; // 40 seconds

    const interval = setInterval(async () => {
        attempts++;
        const { data: summaries } = await supabaseAdmin
            .from('summaries')
            .select('*')
            .eq('target_id', context.id)
            .order('created_at', { ascending: false });

        if (summaries && summaries.length > 0) {
            const summary = summaries[0];
            console.log('Summary found!');
            console.log('Content:', summary.content);

            // Verify structure
            let parsed;
            try {
                parsed = typeof summary.content === 'string' ? JSON.parse(summary.content) : summary.content;
            } catch (e) {
                console.error('Failed to parse summary content');
            }

            if (parsed && parsed.summary && parsed.takeaways && parsed.actions) {
                console.log('✅ Structure verified: Summary, Key Points, Actions present.');
            } else {
                console.error('❌ Structure mismatch:', Object.keys(parsed || {}));
            }

            clearInterval(interval);

            // 5. Test Regeneration
            console.log('Testing Regeneration...');
            const res2 = await fetch('http://localhost:3000/api/agent/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: DEMO_USER_ID,
                    contextId: context.id
                })
            });
            const data2 = await res2.json();
            console.log('Regeneration API Response:', data2);

            // We assume it works if the first one worked, but we could poll for count > 1
            setTimeout(async () => {
                const { count } = await supabaseAdmin
                    .from('summaries')
                    .select('*', { count: 'exact' })
                    .eq('target_id', context.id);

                console.log(`Total summaries for context: ${count}`);
                if ((count || 0) >= 2) {
                    console.log('✅ Regeneration verified (new summary created).');
                } else {
                    console.log('⚠️ Regeneration might be pending or failed.');
                }
                process.exit(0);
            }, 5000);

        } else {
            console.log(`[Attempt ${attempts}] No summary yet...`);
        }

        if (attempts >= maxAttempts) {
            console.log('Timeout waiting for summary.');
            clearInterval(interval);
            process.exit(1);
        }
    }, 2000);
}

testSummaryGeneration();
