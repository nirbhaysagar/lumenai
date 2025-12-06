import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from '../lib/supabase';
import OpenAI from 'openai';
import { getRedisConnection } from '../lib/redis';
import dotenv from 'dotenv';

import { z } from 'zod';

// Schema for validation
const GraphSchema = z.object({
    concepts: z.array(z.object({
        name: z.string(),
        description: z.string(),
        category: z.string()
    })),
    relations: z.array(z.object({
        source: z.string(),
        target: z.string(),
        relation: z.string()
    }))
});

dotenv.config({ path: '.env.local' });



const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

interface GraphExtractionResult {
    concepts: {
        name: string;
        description: string;
        category: string;
    }[];
    relations: {
        source: string;
        target: string;
        relation: string;
    }[];
}

import * as fs from 'fs';
import * as path from 'path';

const logFile = path.resolve(process.cwd(), 'graph_worker.log');
const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.log(msg);
};

export const processGraphJob = async (job: Job) => {
    log(`[GraphWorker] Processing job ${job.id}`);
    const { chunkId, userId } = job.data;

    try {
        // 1. Fetch the Chunk (Try Canonical first, then regular)
        let chunkContent = '';

        // Try canonical_chunks
        const { data: canonicalChunk } = await supabaseAdmin
            .from('canonical_chunks')
            .select('canonical_text')
            .eq('id', chunkId)
            .single();

        if (canonicalChunk) {
            chunkContent = canonicalChunk.canonical_text;
        } else {
            // Try regular chunks
            const { data: regularChunk, error: chunkError } = await supabaseAdmin
                .from('chunks')
                .select('content')
                .eq('id', chunkId)
                .single();

            if (chunkError || !regularChunk) {
                console.error(`[GraphWorker] Chunk not found: ${chunkId}`);
                return;
            }
            chunkContent = regularChunk.content;
        }

        // Schema validation is now at top level

        // ... inside worker ...

        // 2. Extract Concepts & Relations via LLM (with Retry)
        let result: GraphExtractionResult = { concepts: [], relations: [] };
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const completion = await openai.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an Expert Ontologist. Extract a knowledge graph from the text.

ENTITIES:
- Person, Organization, Location, Event, Topic, Technology

RELATIONS:
- source -> relation -> target
- Use specific relation types (e.g., "AUTHORED", "EMPLOYS", "USES", "RELATED_TO", "LOCATED_IN")

JSON STRUCTURE:
{
  "concepts": [
    { "name": "Concept Name", "category": "Person|Tech|etc", "description": "Brief definition" }
  ],
  "relations": [
    { "source": "Concept Name", "target": "Concept Name", "relation": "RELATION_TYPE" }
  ]
}
Extract only the most significant concepts (max 5-7).`
                        },
                        { role: 'user', content: chunkContent.substring(0, 4000) },
                    ],
                    response_format: { type: 'json_object' },
                });

                const rawContent = JSON.parse(completion.choices[0].message.content || '{"concepts":[], "relations":[]}');

                // Validate with Zod
                result = GraphSchema.parse(rawContent);
                break; // Success

            } catch (e) {
                attempts++;
                console.warn(`[GraphWorker] Attempt ${attempts} failed:`, e);
                if (attempts === maxAttempts) {
                    console.error(`[GraphWorker] Failed to extract graph after ${maxAttempts} attempts for chunk ${chunkId}`);
                    return;
                }
                await new Promise(r => setTimeout(r, 1000 * attempts)); // Backoff
            }
        }

        if (!result.concepts || result.concepts.length === 0) {
            console.log(`[GraphWorker] No concepts found for chunk ${chunkId}`);
            return;
        }

        // 3. Upsert Concepts
        const conceptMap = new Map<string, string>(); // Name -> UUID

        for (const concept of result.concepts) {
            const { data, error } = await supabaseAdmin
                .from('concepts')
                .upsert(
                    {
                        user_id: userId,
                        name: concept.name,
                        description: concept.description,
                        category: concept.category,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id, name' }
                )
                .select('id')
                .single();

            if (error) {
                console.error(`[GraphWorker] Failed to upsert concept ${concept.name}`, error);
            } else if (data) {
                conceptMap.set(concept.name, data.id);
            }
        }

        // 4. Link Concepts to Chunk (Grounding)
        const chunkLinks = Array.from(conceptMap.values()).map(conceptId => ({
            concept_id: conceptId,
            chunk_id: chunkId
        }));

        if (chunkLinks.length > 0) {
            await supabaseAdmin.from('concept_chunks').upsert(chunkLinks, { ignoreDuplicates: true });
        }

        // 5. Create Relations
        for (const rel of result.relations) {
            const sourceId = conceptMap.get(rel.source);
            const targetId = conceptMap.get(rel.target);

            if (sourceId && targetId && sourceId !== targetId) {
                await supabaseAdmin
                    .from('concept_relations')
                    .upsert(
                        {
                            source_concept_id: sourceId,
                            target_concept_id: targetId,
                            relation_type: rel.relation,
                        },
                        { onConflict: 'source_concept_id, target_concept_id, relation_type' }
                    );
            }
        }

        console.log(`[GraphWorker] Successfully extracted ${result.concepts.length} concepts and ${result.relations.length} relations for chunk ${chunkId}`);

    } catch (err: any) {
        log(`[GraphWorker] Error: ${err.message}`);
        throw err;
    }
};

export const startGraphWorker = () => {
    const connection = getRedisConnection();
    const graphWorker = new Worker(
        'graph-queue',
        processGraphJob,
        { connection }
    );

    graphWorker.on('completed', (job) => {
        log(`[GraphWorker] ✅ Completed job ${job.id}`);
    });

    graphWorker.on('failed', (job, err) => {
        log(`[GraphWorker] ❌ Failed job ${job?.id}: ${err.message}`);
    });

    graphWorker.on('error', (err) => {
        log(`[GraphWorker] ⚠️ Worker error: ${err.message}`);
    });

    graphWorker.on('active', (job) => {
        log(`[GraphWorker] 🔄 Processing job ${job.id}`);
    });

    log('[GraphWorker] Worker initialized and listening for jobs...');
    return graphWorker;
};
