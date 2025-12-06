import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials for Digest Worker');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const QUEUE_NAME = 'digest';

interface DigestJobData {
    userId: string;
}

export const processDigestJob = async (job: Job<DigestJobData>) => {
    const { userId } = job.data;
    console.log(`[Digest] Processing daily digest for user: ${userId}`);

    try {
        // 1. Fetch Yesterday's Captures
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: captures } = await supabase
            .from('captures')
            .select('title, type, created_at')
            .eq('user_id', userId)
            .gte('created_at', yesterday.toISOString())
            .lt('created_at', today.toISOString());

        // 2. Fetch Today's High Priority Tasks
        // Assuming tasks are stored in 'tasks' table or extracted from chunks. 
        // For now, let's try to fetch from 'tasks' table if it exists, or mock it if we don't have a robust task system yet.
        // Based on previous context, we have a 'tasks' table.
        const { data: tasks } = await supabase
            .from('tasks')
            .select('content, priority')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .eq('priority', 'high')
            .limit(5);

        // 3. Resurface a Forgotten Memory (Older than 7 days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // We'll fetch a random memory (summary) created before last week
        // Since we can't do random easily in Supabase without a function, we'll fetch a batch and pick one.
        const { data: memories } = await supabase
            .from('summaries')
            .select('content, created_at')
            .eq('user_id', userId)
            .lt('created_at', lastWeek.toISOString())
            .limit(20);

        const randomMemory = memories && memories.length > 0
            ? memories[Math.floor(Math.random() * memories.length)]
            : null;

        // 4. Generate Digest Content using LLM
        const prompt = `
            You are a helpful personal assistant creating a "Daily Digest" for the user.
            
            Here is what happened yesterday:
            ${captures?.map(c => `- [${c.type}] ${c.title}`).join('\n') || 'No captures recorded.'}

            Here are today's high priority tasks:
            ${tasks?.map(t => `- ${t.content}`).join('\n') || 'No high priority tasks.'}

            Here is a memory from the past to resurface:
            ${randomMemory ? randomMemory.content : 'No old memories found.'}

            Please generate a concise, encouraging morning summary (JSON format).
            The JSON should have:
            - "greeting": A warm greeting.
            - "summary": A 1-2 sentence summary of yesterday's progress.
            - "focus": A 1-2 sentence suggestion for today's focus based on tasks.
            - "memory": A brief sentence about the resurfaced memory (if any).
        `;

        const { text } = await generateText({
            model: openai('llama-3.3-70b-versatile'), // Using Groq via OpenAI compatibility
            prompt: prompt,
        });

        // Clean up JSON if needed (sometimes LLM wraps in markdown)
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const digestContent = JSON.parse(jsonStr);

        // 5. Insert Notification
        const { error: insertError } = await supabase.from('notifications').insert({
            user_id: userId,
            type: 'digest',
            title: 'Your Daily Digest',
            content: digestContent,
            is_read: false
        });

        if (insertError) {
            console.error('[Digest] Failed to insert notification:', insertError);
            throw insertError;
        }

        console.log(`[Digest] Created digest notification for user: ${userId}`);

    } catch (error) {
        console.error(`[Digest] Failed to process digest for user ${userId}:`, error);
        throw error;
    }
};

export const startDigestWorker = () => {
    const digestWorker = new Worker<DigestJobData>(QUEUE_NAME, processDigestJob, {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        }
    });
    return digestWorker;
};
