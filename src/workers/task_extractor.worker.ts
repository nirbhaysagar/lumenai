import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';
import { logUsage } from '@/lib/logger';
import { getRedisConnection } from '@/lib/redis';
import { addBreadcrumb, captureException } from '@/lib/sentryHelpers';



import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Check for Groq Key (explicit or via OPENAI_API_KEY if it looks like a Groq key)
const groqKey = process.env.GROQ_API_KEY || (process.env.OPENAI_API_KEY?.startsWith('gsk_') ? process.env.OPENAI_API_KEY : undefined);

let model: any;

if (groqKey) {
    const groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: groqKey,
    });
    model = groq('llama-3.3-70b-versatile');
} else if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    model = openai('gpt-4o');
} else {
    console.warn('[TaskExtractor] No valid API key found. Worker may fail.');
}

export const processTaskExtractorJob = async (job: Job) => {
    const { messageId, userId, contextId } = job.data;
    console.log(`[TaskExtractor] Processing job ${job.id} for message ${messageId}`);

    addBreadcrumb('Task extractor job started', {
        jobId: job.id,
        messageId,
        userId,
        contextId,
    });

    try {
        // Fetch the message content
        const { data: message, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('content, role')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            console.log(`[TaskExtractor] Message not found: ${messageId}`);
            return { success: true, tasksExtracted: 0 };
        }

        // Only extract from assistant messages (which contain the full conversation context)
        if (message.role !== 'assistant') {
            console.log(`[TaskExtractor] Skipping non-assistant message`);
            return { success: true, tasksExtracted: 0 };
        }

        // Fetch recent conversation context (last 5 messages)
        const { data: recentMessages } = await supabaseAdmin
            .from('messages')
            .select('content, role')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        const conversationContext = recentMessages
            ?.reverse()
            .map(m => `${m.role}: ${m.content}`)
            .join('\n\n') || message.content;

        console.log(`[TaskExtractor] Analyzing conversation for tasks...`);

        addBreadcrumb('Calling LLM for task extraction', {
            model: 'llama-3.3-70b-versatile',
            conversationLength: conversationContext.length,
        });

        // Call LLM to extract tasks
        // Call LLM to extract tasks
        const { text: resultContent, usage } = await generateText({
            model,
            messages: [
                {
                    role: 'system',
                    content: `You are an Expert Project Manager. Your goal is to extract actionable tasks from the conversation.

CRITERIA FOR A TASK:
1. **Explicit**: It must be a clear commitment or direct request.
2. **Actionable**: It must start with a verb and have a clear object (Action + Description).
3. **Future-Oriented**: It must be something that needs to be done, not something already done.

ANTI-HALLUCINATION RULES:
- Do NOT extract tasks from general discussion, status updates, or hypotheticals.
- If a statement is vague (e.g., "We should think about it"), IGNORE IT.
- If there are no clear tasks, return {"tasks": []}.

Return a JSON object with this structure:
{
  "tasks": [
    {
      "content": "Verb + Description (e.g., 'Refactor the login API')",
      "priority": "high" | "medium" | "low",
      "due_date": "ISO string or null"
    }
  ]
}`
                },
                {
                    role: 'user',
                    content: `Extract tasks from this conversation:\n\n${conversationContext}`
                },
            ],
        });

        // const resultContent = completion.choices[0].message.content || '{"tasks": []}';
        // const usage = completion.usage;

        if (usage) {
            logUsage(userId, 'task_extraction', 'llama-3.3-70b-versatile', usage.promptTokens, usage.completionTokens);
        }

        // Parse and validate
        let extractedData;
        try {
            extractedData = JSON.parse(resultContent);
        } catch (e) {
            console.error('[TaskExtractor] Failed to parse LLM response', e);
            return { success: false, error: 'Invalid JSON from LLM' };
        }

        const tasks = extractedData.tasks || [];

        if (tasks.length === 0) {
            console.log(`[TaskExtractor] No tasks found in message ${messageId}`);
            return { success: true, tasksExtracted: 0 };
        }

        // Save tasks to database
        const tasksToInsert = tasks.map((task: any) => ({
            user_id: userId,
            message_id: messageId,
            context_id: contextId || null,
            content: task.content,
            priority: task.priority || 'medium',
            due_date: task.due_date || null,
            status: 'pending',
        }));

        const { error: insertError } = await supabaseAdmin
            .from('tasks')
            .insert(tasksToInsert);

        if (insertError) {
            console.error('[TaskExtractor] Failed to insert tasks:', insertError);
            throw insertError;
        }

        console.log(`[TaskExtractor] Successfully extracted ${tasks.length} tasks from message ${messageId}`);
        addBreadcrumb('Task extraction completed', {
            jobId: job.id,
            tasksExtracted: tasks.length,
        });
        return { success: true, tasksExtracted: tasks.length };

    } catch (error: any) {
        console.error(`[TaskExtractor] Job ${job.id} failed:`, error);
        captureException(error, {
            jobId: job.id,
            messageId,
            userId,
        });
        throw error;
    }
};

export const startTaskExtractorWorker = () => {
    const connection = getRedisConnection();
    const taskExtractorWorker = new Worker('task_extractor', processTaskExtractorJob, { connection });
    return taskExtractorWorker;
};
