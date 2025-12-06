import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../lib/supabase';

console.log('🚀 Starting Topicer Worker...');

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

console.log('🚀 Starting Topicer Worker...');

export const processTopicerJob = async (job: any) => {
    const { chunkId } = job.data;
    console.log(`🏷️  Tagging chunk ${chunkId}`);

    try {
        // 1. Fetch Chunk
        const { data: chunk, error: chunkError } = await supabaseAdmin
            .from('chunks')
            .select('content, metadata')
            .eq('id', chunkId)
            .single();

        if (chunkError || !chunk) {
            throw new Error(`Chunk not found: ${chunkError?.message}`);
        }

        // 2. Generate Topics via LLM (Groq)
        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile', // Updated Groq model
            messages: [
                { role: 'system', content: 'Extract 3-5 relevant topics/tags from the text. Return JSON format: { "topics": ["tag1", "tag2"], "importance": 1-10 }' },
                { role: 'user', content: chunk.content.substring(0, 1000) }, // Limit context
            ],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        const topics: string[] = result.topics || [];

        // 3. Save Tags to Relational Tables
        if (topics.length > 0) {
            for (const topic of topics) {
                // A. Upsert Tag
                const { data: tagData, error: tagError } = await supabaseAdmin
                    .from('tags')
                    .upsert({ name: topic }, { onConflict: 'name' })
                    .select('id')
                    .single();

                if (tagError) {
                    console.error(`Failed to upsert tag "${topic}":`, tagError);
                    continue;
                }

                // B. Link to Chunk
                if (tagData) {
                    const { error: linkError } = await supabaseAdmin
                        .from('chunk_tags')
                        .insert({ chunk_id: chunkId, tag_id: tagData.id })
                        .select() // just to execute
                        .maybeSingle(); // ignore if exists (though insert usually throws on conflict without upsert)

                    // Actually, better to use upsert or ignore conflict
                    // But chunk_tags has PK (chunk_id, tag_id), so insert will fail if exists.
                    // Let's use upsert or ignore.
                    if (linkError && linkError.code !== '23505') { // 23505 is unique violation
                        console.error(`Failed to link tag "${topic}" to chunk:`, linkError);
                    }
                }
            }
        }

        // 4. Update Chunk Metadata (Legacy/Cache)
        const newMetadata = {
            ...chunk.metadata,
            topics: topics,
            importance: result.importance || 5,
            tagged_at: new Date().toISOString(),
        };

        await supabaseAdmin
            .from('chunks')
            .update({ metadata: newMetadata })
            .eq('id', chunkId);

        console.log(`✅ Tagged chunk ${chunkId}:`, result.topics);

    } catch (error: any) {
        console.error(`❌ Failed to tag chunk ${chunkId}:`, error.message);
        throw error;
    }
};

export const startTopicerWorker = () => {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
    });
    const worker = new Worker('topicer-queue', processTopicerJob, { connection });

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job?.id} failed with ${err.message}`);
    });

    return worker;
};
