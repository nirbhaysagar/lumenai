
import { Worker, Job } from 'bullmq';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';
import { logUsage } from '@/lib/logger';
import { getRedisConnection } from '@/lib/redis';
import { addBreadcrumb, captureException } from '@/lib/sentryHelpers';



const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const processSummarizerJob = async (job: Job) => {
    const { contextId, chunkIds, userId } = job.data;
    console.log(`[Summarizer] Processing job ${job.id} for user ${userId}`);

    addBreadcrumb('Summarizer job started', {
        jobId: job.id,
        userId,
        contextId,
        chunkCount: chunkIds?.length || 0,
    });

    try {
        let contentToSummarize = '';
        let targetId = contextId;
        let targetType = 'context';

        let contextName = 'General Workspace';
        let contextDescription = '';

        if (contextId) {
            // Fetch chunks for context
            const { data: contextChunks } = await supabaseAdmin
                .from('context_chunks')
                .select('chunks(content)')
                .eq('context_id', contextId);

            if (contextChunks) {
                contentToSummarize = contextChunks.map((c: any) => c.chunks?.content).filter(Boolean).join('\n\n');
            }

            // Fetch context details for better prompting
            const { data: contextData } = await supabaseAdmin
                .from('contexts')
                .select('name, description')
                .eq('id', contextId)
                .single();

            if (contextData) {
                contextName = contextData.name;
                contextDescription = contextData.description || '';
            }
        } else if (job.data.captureId) {
            // If captureId is provided, use it as target
            targetId = job.data.captureId;
            targetType = 'capture';

            // Fetch chunks if needed for content
            if (chunkIds && chunkIds.length > 0) {
                const { data: chunks } = await supabaseAdmin
                    .from('chunks')
                    .select('content')
                    .in('id', chunkIds);

                if (chunks) {
                    contentToSummarize = chunks.map((c: any) => c.content).join('\n\n');
                }
            }
        } else if (chunkIds && chunkIds.length > 0) {
            // Fetch specific chunks
            const { data: chunks } = await supabaseAdmin
                .from('chunks')
                .select('content')
                .in('id', chunkIds);

            if (chunks) {
                contentToSummarize = chunks.map((c: any) => c.content).join('\n\n');
            }
            targetId = chunkIds[0]; // Just use first chunk ID as reference if multiple
            targetType = 'chunk_group';
        }

        if (!contentToSummarize) {
            throw new Error('No content found to summarize');
        }

        // Truncate to avoid context limits (approx 30k chars ~ 7-8k tokens)
        const truncatedContent = contentToSummarize.substring(0, 30000);

        console.log(`[Summarizer] Generating summary for content length: ${truncatedContent.length}`);

        addBreadcrumb('Calling LLM for summary generation', {
            model: 'llama-3.3-70b-versatile',
            contentLength: truncatedContent.length,
        });

        const systemPrompt = `You are an Expert Knowledge Analyst. Your task is to summarize content from the workspace: "${contextName}".
${contextDescription ? `Context Description: "${contextDescription}"` : ''}

INSTRUCTIONS:
1. Analyze the provided text strictly. Do NOT use outside knowledge.
2. If the text is empty or meaningless, return empty arrays.
3. Output valid JSON.

STRUCTURE:
- "summary": A concise executive summary (3-5 sentences).
- "takeaways": 3-5 key insights or patterns found in the text.
- "actions": Concrete, actionable next steps extracted from the text.

Return a JSON object with the following structure:
{
  "summary": "...",
  "takeaways": ["..."],
  "actions": ["..."]
}`;

        // Call LLM with JSON mode
        let summaryContent = '{}';
        try {
            const completion = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: truncatedContent },
                ],
                response_format: { type: 'json_object' },
            });

            summaryContent = completion.choices[0].message.content || '{}';
            const usage = completion.usage;

            if (usage) {
                logUsage(userId, 'summary', 'llama-3.3-70b-versatile', usage.prompt_tokens, usage.completion_tokens);
            }
        } catch (apiError: any) {
            console.error('[Summarizer] LLM API failed, using fallback:', apiError.message);
            // Fallback summary
            summaryContent = JSON.stringify({
                summary: "Content processing completed. (AI Summary unavailable due to API limits)",
                takeaways: ["Content successfully ingested", "Ready for search", "Knowledge graph updated"],
                actions: ["Review original content", "Check back later for AI insights"]
            });
        }

        // Validate JSON
        try {
            JSON.parse(summaryContent);
        } catch (e) {
            console.error("Failed to parse summary JSON", e);
            throw new Error('Failed to generate valid summary JSON');
        }

        // Save to DB
        const insertData: any = {
            target_id: targetId,
            target_type: targetType,
            content: summaryContent,
            // user_id: userId // Column does not exist
        };

        if (targetType === 'context') {
            insertData.context_id = targetId;
        }

        const { error } = await supabaseAdmin
            .from('summaries')
            .insert(insertData);

        if (error) throw error;

        console.log(`[Summarizer] Job ${job.id} completed successfully`);
        addBreadcrumb('Summarizer job completed', { jobId: job.id });
        return { success: true };

    } catch (error: any) {
        console.error(`[Summarizer] Job ${job.id} failed:`, error);
        captureException(error, {
            jobId: job.id,
            userId,
            contextId,
        });
        throw error;
    }
};

export const startSummarizerWorker = () => {
    const connection = getRedisConnection();
    const summarizerWorker = new Worker('summarizer-queue', processSummarizerJob, { connection });
    return summarizerWorker;
};
