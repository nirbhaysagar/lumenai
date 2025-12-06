import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from '../lib/supabase';
import OpenAI from 'openai';
import { generateEmbeddings } from '../lib/embeddings';
// import { graphQueue } from '../lib/queue';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { logUsage } from '../lib/logger';
import { getRedisConnection } from '../lib/redis';

dotenv.config({ path: '.env.local' });

// BullMQ connection


const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const processDedupJob = async (job: Job) => {
    console.log(`Processing dedup job ${job.id}`);
    const { userId } = job.data;
    console.log(`[Dedup] Started for user ${userId}`);

    try {
        // 1. Fetch unmapped chunks (chunks not in canonical_map as child or canonical)
        // This is a simplification; for a robust system, we'd need better tracking.
        // For now, let's fetch ALL chunks for the user and process them.
        // In production, we would use a 'processed' flag or timestamp.

        const { data: chunks, error } = await supabaseAdmin
            .from('chunks')
            .select('id, content, capture_id, captures!inner(user_id)')
            .eq('captures.user_id', userId)
            .limit(100); // Process in batches

        if (error) throw error;
        if (!chunks || chunks.length === 0) {
            console.log('[Dedup] No chunks found for user');
            return;
        }
        console.log(`[Dedup] Found ${chunks.length} chunks to process`);

        const processedIds = new Set();

        for (const chunk of chunks) {
            if (processedIds.has(chunk.id)) continue;

            // 2. Find neighbors
            const embedding = await generateEmbeddings(chunk.content);

            const { data: neighbors } = await supabaseAdmin.rpc('match_chunks', {
                query_embedding: embedding,
                match_threshold: 0.1, // Lower threshold to catch everything
                match_count: 10,
                filter_user_id: userId,
            });

            console.log(`[Dedup] Chunk ${chunk.id}: Found ${neighbors?.length || 0} neighbors`);

            if (neighbors && neighbors.length > 0) {
                // Filter neighbors that are not already processed/mapped
                // (This logic needs to be robust against race conditions in a real distributed system)

                const cluster = neighbors.filter((n: any) => !processedIds.has(n.id));

                if (cluster.length > 0) {
                    console.log(`Processing cluster of ${cluster.length} chunks`);

                    // Mark as processed
                    cluster.forEach((c: any) => processedIds.add(c.id));

                    let canonicalContent = '';

                    if (cluster.length > 1) {
                        // 3a. Generate Canonical Summary for Duplicates
                        const combinedContent = cluster.map((c: any) => c.content).join('\n---\n');
                        const completion = await openai.chat.completions.create({
                            model: 'llama-3.3-70b-versatile',
                            messages: [
                                { role: 'system', content: 'Summarize the following duplicate text segments into a single canonical version. Preserve all key information and links.' },
                                { role: 'user', content: combinedContent.substring(0, 10000) },
                            ],
                        });
                        canonicalContent = completion.choices[0].message.content || 'Canonical content';
                    } else {
                        // 3b. Use Original Content for Unique Chunk
                        canonicalContent = cluster[0].content;
                    }

                    // 4. Create Canonical Chunk & Embed
                    const canonicalEmbedding = await generateEmbeddings(canonicalContent);

                    const { data: canonicalChunk, error: createError } = await supabaseAdmin
                        .from('canonical_chunks')
                        .insert({
                            canonical_text: canonicalContent,
                            repr_vector: canonicalEmbedding,
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Failed to create canonical chunk', createError);
                        continue;
                    }

                    // 6. Map Children to Canonical
                    const mapInserts = cluster.map((c: any) => ({
                        chunk_id: c.id,
                        canonical_id: canonicalChunk.id,
                        similarity_score: 1.0 // Placeholder
                    }));

                    const { error: mapError } = await supabaseAdmin
                        .from('canonical_map')
                        .insert(mapInserts);

                    if (mapError) {
                        console.error('Failed to update canonical map', mapError);
                    } else {
                        console.log(`Successfully processed ${cluster.length} chunks into canonical ${canonicalChunk.id}`);

                        // 7. Trigger Knowledge Graph Extraction (Layer 3)
                        console.log(`[Dedup] About to trigger graph extraction for canonical chunk ${canonicalChunk.id}, userId: ${userId}`);
                        try {
                            const { graphQueue } = await import('../lib/queue');
                            const graphJob = await graphQueue.add('extract_graph', { chunkId: canonicalChunk.id, userId });
                            console.log(`[Dedup] ✅ Triggered graph extraction job ${graphJob.id} for ${canonicalChunk.id}`);
                        } catch (graphError) {
                            console.error(`[Dedup] ❌ Failed to enqueue graph job:`, graphError);
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error('Dedup worker error:', err);
        throw err;
    }
};

export const startDedupWorker = () => {
    const connection = getRedisConnection();
    const dedupWorker = new Worker(
        'dedup-queue',
        processDedupJob,
        { connection }
    );

    dedupWorker.on('completed', (job) => {
        console.log(`Dedup job ${job.id} completed!`);
    });

    dedupWorker.on('failed', (job, err) => {
        console.error(`Dedup job ${job?.id} failed: ${err.message}`);
    });

    return dedupWorker;
};
