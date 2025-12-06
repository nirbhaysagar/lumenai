import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from '../lib/supabase';
import OpenAI from 'openai';
import { getRedisConnection } from '../lib/redis';
import { generateEmbeddings } from '../lib/embeddings';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });



const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const processRecallJob = async (job: Job) => {
    console.log(`[RecallWorker] Processing job ${job.id} type: ${job.name}`);
    const { type, userId, content, recallItemId } = job.data;

    try {
        if (job.name === 'explicit_recall') {
            // Handle "Remember this" request
            await handleExplicitRecall(userId, content, recallItemId);
        } else if (job.name === 'predictive_recall') {
            // Handle Spaced Repetition / Resurfacing
            await handlePredictiveRecall(userId);
        } else if (job.name === 'detect_recall_opportunities') {
            // Detect new items from recent chats
            await handleDetectRecallOpportunities(userId);
        }

    } catch (err) {
        console.error('[RecallWorker] Error:', err);
        throw err;
    }
};

export const startRecallWorker = () => {
    const connection = getRedisConnection();
    const recallWorker = new Worker(
        'recall-queue',
        processRecallJob,
        { connection }
    );
    return recallWorker;
};

async function handleExplicitRecall(userId: string, content: string, recallItemId: string) {
    console.log(`[RecallWorker] Handling explicit recall for item ${recallItemId}`);

    if (!content || !recallItemId) {
        console.error(`[RecallWorker] Invalid job data for item ${recallItemId}`);
        return;
    }

    // 1. Generate Q&A Pair
    let question = content;
    let answer = "";

    try {
        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a Flashcard Generator. Given the text, generate a specific question to test recall of the key information, and a concise answer.
                    Return JSON: { "question": "...", "answer": "..." }`
                },
                { role: 'user', content: content }
            ],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        if (result.question && result.answer) {
            question = result.question;
            answer = result.answer;
        }
    } catch (e) {
        console.error('[RecallWorker] Failed to generate Q&A:', e);
        // Fallback to using content as question
    }

    // 2. Generate Embedding (for the Question)
    let embedding: number[];
    try {
        embedding = await generateEmbeddings(question);
    } catch (error) {
        console.error(`[RecallWorker] Failed to generate embedding for item ${recallItemId}`, error);
        throw error;
    }

    // 3. Find relevant chunks (Context)
    const { data: relevantChunks } = await supabaseAdmin.rpc('match_chunks', {
        query_embedding: embedding,
        match_threshold: 0.8,
        match_count: 3,
        filter_user_id: userId,
    });

    const sourceChunkId = relevantChunks && relevantChunks.length > 0 ? relevantChunks[0].id : null;

    // 4. Update Recall Item
    const recallContent = JSON.stringify({
        question,
        answer,
        original_text: content
    });

    await supabaseAdmin
        .from('recall_items')
        .update({
            content: recallContent, // Store JSON string here
            source_chunk_id: sourceChunkId,
            status: 'active'
        })
        .eq('id', recallItemId);

    // 5. Initialize Memory Strength
    await supabaseAdmin
        .from('memory_strength')
        .insert({
            recall_item_id: recallItemId,
            strength: 1.0,
            interval_days: 1.0,
            next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

    console.log(`[RecallWorker] Explicit recall item ${recallItemId} processed.`);
}

async function handlePredictiveRecall(userId: string) {
    console.log(`[RecallWorker] Running predictive recall for user ${userId}`);

    // 1. Find items due for review
    const { data: dueItems, error } = await supabaseAdmin
        .from('memory_strength')
        .select('recall_item_id, recall_items!inner(user_id)')
        .eq('recall_items.user_id', userId)
        .lte('next_review_at', new Date().toISOString())
        .limit(5);

    if (error) {
        console.error('[RecallWorker] Failed to fetch due items', error);
        return;
    }

    if (!dueItems || dueItems.length === 0) {
        console.log('[RecallWorker] No items due for review.');
        return;
    }

    // 2. Surface them (For now, we just log. In real app, push to UI/Notification)
    // We might create a "Daily Refresher" notification or simply mark them as 'ready_to_view'
    console.log(`[RecallWorker] Found ${dueItems.length} items for review:`, dueItems.map(i => i.recall_item_id));

    // In a real implementation, we might trigger a push notification or update a "dashboard_feed" table.
}



async function handleDetectRecallOpportunities(userId: string) {
    console.log(`[RecallWorker] Detecting recall opportunities for user ${userId}`);

    // 1. Fetch recent user messages (last 24 hours)
    const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('content, created_at')
        .eq('user_id', userId)
        .eq('role', 'user')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

    if (error || !messages || messages.length === 0) {
        console.log('[RecallWorker] No recent messages to analyze.');
        return;
    }

    const combinedText = messages.map(m => m.content).join('\n');

    // 2. Ask LLM to extract facts
    try {
        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a Knowledge Extractor. Analyze the user's recent messages and identify 1-3 key facts, concepts, or tasks that would be valuable for them to remember long-term.
                    Ignore trivial chatter. Focus on learning goals, project details, or specific insights.
                    Return JSON: { "items": [ { "content": "...", "reason": "..." } ] }`
                },
                { role: 'user', content: `Recent User Input:\n${combinedText}` }
            ],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        const items = result.items || [];

        console.log(`[RecallWorker] Extracted ${items.length} potential recall items.`);

        for (const item of items) {
            // Insert as 'suggested'
            await supabaseAdmin.from('recall_items').insert({
                user_id: userId,
                content: item.content,
                recall_type: 'predictive',
                status: 'suggested',
            });
        }

    } catch (e) {
        console.error('[RecallWorker] Failed to detect opportunities:', e);
    }
}
