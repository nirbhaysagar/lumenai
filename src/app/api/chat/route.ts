import { streamText, StreamData } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { searchWeb, planGoal } from '@/lib/agents/tools';

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});
import { supabaseAdmin } from '@/lib/supabase';
import { generateEmbeddings } from '@/lib/embeddings';
import { logUsage } from '@/lib/logger';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, userId, contextId, captureId } = await req.json();
        const lastMessage = messages[messages.length - 1];

        if (!userId || !lastMessage) {
            return new Response('Missing required fields', { status: 400 });
        }

        // 1. Save User Message
        await supabaseAdmin.from('messages').insert({
            user_id: userId,
            context_id: contextId === 'default' ? null : contextId,
            // We might want to store capture_id in metadata or a new column if we want to track it
            metadata: captureId ? { captureId } : null,
            role: 'user',
            content: lastMessage.content,
        });

        // 2. Generate Embedding
        const embedding = await generateEmbeddings(lastMessage.content);

        // 3. Vector Search (Top 30)
        const { data: chunks, error: searchError } = await supabaseAdmin.rpc('match_chunks', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 30,
            filter_user_id: userId,
            filter_capture_id: captureId || null,
        });

        if (searchError) {
            console.error('Vector search error:', searchError);
            // Continue without context if search fails, or handle gracefully
        }

        // 4. Hybrid Reranking
        const now = new Date().getTime();
        const scoredChunks = (chunks || []).map((chunk: any) => {
            const similarity = chunk.similarity;
            const daysOld = (now - new Date(chunk.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const recency = Math.max(0, 1 - daysOld / 30);
            const importance = (chunk.metadata?.importance || 5) / 10;
            const score = (0.6 * similarity) + (0.25 * recency) + (0.15 * importance);
            return { ...chunk, score };
        });

        scoredChunks.sort((a: any, b: any) => b.score - a.score);
        const topChunks = scoredChunks.slice(0, 6);

        // 5. Construct Prompt with Multi-Type Grouping
        // Group chunks by source type for better multi-type reasoning
        const chunksByType: Record<string, any[]> = {
            pdf: [],
            url: [],
            text: [],
            image: []
        };

        topChunks.forEach((chunk: any) => {
            const type = chunk.metadata?.type || 'text';
            if (chunksByType[type]) {
                chunksByType[type].push(chunk);
            } else {
                chunksByType.text.push(chunk);
            }
        });

        // Format each source type group with descriptive headers
        const formattedSections: string[] = [];

        if (chunksByType.pdf.length > 0) {
            const pdfContent = chunksByType.pdf.map((chunk: any) => {
                const date = new Date(chunk.created_at).toLocaleDateString();
                const page = chunk.metadata?.page ? `, Page: ${chunk.metadata.page}` : '';
                const title = chunk.metadata?.title ? `, Title: "${chunk.metadata.title}"` : '';
                return `[Source: ${chunk.id}] (Date: ${date}${page}${title})\n${chunk.content}`;
            }).join('\n\n');
            formattedSections.push(`=== PDF DOCUMENTS ===\n${pdfContent}`);
        }

        if (chunksByType.url.length > 0) {
            const urlContent = chunksByType.url.map((chunk: any) => {
                const date = new Date(chunk.created_at).toLocaleDateString();
                const url = chunk.metadata?.url ? `, URL: ${chunk.metadata.url}` : '';
                const title = chunk.metadata?.title ? `, Title: "${chunk.metadata.title}"` : '';
                return `[Source: ${chunk.id}] (Date: ${date}${url}${title})\n${chunk.content}`;
            }).join('\n\n');
            formattedSections.push(`=== WEB SOURCES ===\n${urlContent}`);
        }

        if (chunksByType.text.length > 0) {
            const textContent = chunksByType.text.map((chunk: any) => {
                const date = new Date(chunk.created_at).toLocaleDateString();
                const title = chunk.metadata?.title ? `, Title: "${chunk.metadata.title}"` : '';
                return `[Source: ${chunk.id}] (Date: ${date}${title})\n${chunk.content}`;
            }).join('\n\n');
            formattedSections.push(`=== NOTES & TEXT ===\n${textContent}`);
        }

        if (chunksByType.image.length > 0) {
            const imageContent = chunksByType.image.map((chunk: any) => {
                const date = new Date(chunk.created_at).toLocaleDateString();
                const title = chunk.metadata?.title ? `, Title: "${chunk.metadata.title}"` : '';
                return `[Source: ${chunk.id}] (Date: ${date}${title})\n${chunk.content}`;
            }).join('\n\n');
            formattedSections.push(`=== IMAGES ===\n${imageContent}`);
        }

        const contextText = formattedSections.join('\n\n');

        const systemPrompt = `You are Lumen, an AI memory assistant with access to advanced tools.
    
    CORE RESPONSIBILITIES:
    1. Answer user questions based on the provided Context (your memory).
    2. If the Context is insufficient, use the 'searchWeb' tool to find external information.
    3. If the user asks for a plan, roadmap, or complex task breakdown, use the 'planGoal' tool.
    
    CONTEXT USAGE:
    - Use ONLY the following context to answer the user's question initially.
    - Do NOT use outside knowledge or mention external sources like Wikipedia or IMDb unless they are explicitly in the context OR you have used the 'searchWeb' tool.
    - If the answer is not in the context, and you haven't searched yet, consider using 'searchWeb'.
    
    MULTI-TYPE REASONING:
    - You may receive context from DIFFERENT SOURCE TYPES: PDF documents, web pages, personal notes, and images
    - Synthesize information across these different formats when answering
    - When explaining your answer, distinguish which type of source provided which information
    - Example: "According to the PDF documentation [Source: xxx], ... Additionally, the web article [Source: yyy] mentions..."
    - If sources conflict, acknowledge both perspectives and note which type each came from
    
    CITATION RULES:
    - You MUST cite your sources using the exact format: [Source: <uuid>]
    - Do NOT use any other format like (Source: Wikipedia) or [1]
    - Place citations immediately after the relevant sentence
    - In your final summary, briefly note which types of sources were used (e.g., "Based on 2 PDFs and 1 web source...")

    TASK HANDLING:
    - If the user asks you to "remind me", "create a task", "schedule a meeting", or "add to todo", you MUST acknowledge it affirmatively.
    - Say something like "I've added that to your action items" or "Noted, I'll remind you."
    - Do NOT say you cannot set reminders. A background system will process your confirmation to create the actual task.
    
    Context:
    ${contextText}`;

        // 6. Stream Response with Data
        const data = new StreamData();
        data.append({
            sources: topChunks.map((c: any) => ({
                chunkId: c.id,
                captureId: c.capture_id,
                snippet: c.content.substring(0, 100) + '...',
                metadata: c.metadata,
                score: c.score,
                sourceType: c.metadata?.type || 'text',
                // Type-specific metadata for display
                url: c.metadata?.url,
                pdfPage: c.metadata?.page,
                title: c.metadata?.title,
            }))
        });

        const result = await streamText({
            model: groq('llama-3.3-70b-versatile'),
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            tools: {
                searchWeb,
                planGoal
            },
            maxSteps: 5, // Allow multi-step reasoning (e.g. Search -> Answer)
            onFinish: async ({ text, usage }) => {
                data.close();

                // Execute background tasks without blocking the response stream
                (async () => {
                    try {
                        // 7. Save Assistant Message
                        const { data: savedMessage } = await supabaseAdmin.from('messages').insert({
                            user_id: userId,
                            context_id: contextId === 'default' ? null : contextId,
                            role: 'assistant',
                            content: text,
                            metadata: {
                                sources: topChunks.map((c: any) => c.id),
                                usage
                            }
                        }).select().single();

                        // 8. Trigger Task Extraction
                        if (savedMessage) {
                            const { taskExtractorQueue } = await import('@/lib/queue');

                            await taskExtractorQueue.add('extract', {
                                messageId: savedMessage.id,
                                userId,
                                contextId: contextId === 'default' ? null : contextId,
                            });
                        }
                    } catch (err) {
                        console.error('Background task error:', err);
                    }
                })();
            },
        });

        return result.toDataStreamResponse({ data });

    } catch (error: any) {
        console.error('Chat API error:', error);

        // Handle specific error types
        if (error.status === 429) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' }), { status: 429 });
        }

        if (error.name === 'TimeoutError') {
            return new Response(JSON.stringify({ error: 'Request timed out', code: 'TIMEOUT' }), { status: 504 });
        }

        return new Response(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message }), { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const contextId = searchParams.get('contextId');
    const captureId = searchParams.get('captureId');

    if (!userId) {
        return new Response('Missing userId', { status: 400 });
    }

    try {
        let query = supabaseAdmin
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (contextId && contextId !== 'default') {
            query = query.eq('context_id', contextId);
        } else {
            query = query.is('context_id', null);
        }

        // If captureId is provided, filter by it (assuming it's stored in metadata->captureId)
        if (captureId) {
            // This assumes metadata is a JSONB column and has a captureId field
            query = query.eq('metadata->>captureId', captureId);
        }

        const { data: messages, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify(messages), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Failed to fetch chat history:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
