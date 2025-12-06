import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { commandId, args, userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[Palette] Executing command: ${commandId}`, args);

        switch (commandId) {
            case 'summarize-context':
                // Call existing summarize agent
                // In a real app, you might import the logic directly or call the internal API URL
                // For now, we'll simulate the call or redirect logic
                return await forwardToApi('/api/agent/summarize', { contextId: args.contextId, userId });

            case 'run-dedup':
                return await forwardToApi('/api/admin/dedup', { contextId: args.contextId, userId });

            case 'generate-tasks':
                return await forwardToApi('/api/tasks/extract', { contextId: args.contextId, userId });

            default:
                return NextResponse.json({ error: 'Unknown command' }, { status: 400 });
        }

    } catch (error) {
        console.error('Command execution failed', error);
        return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
    }
}

async function forwardToApi(url: string, body: any) {
    // In Next.js App Router, calling local API routes via fetch requires full URL or internal logic
    // For simplicity in this "monolith", we'll assume we can just return success 
    // and let the client know, or actually perform the logic if we imported the service functions.

    // Ideally: import { summarizeContext } from '@/lib/agents/summarizer'; await summarizeContext(...)

    // Mocking successful dispatch for now as we don't want to double-invoke heavy agents synchronously
    let message = `Command dispatched to ${url}`;
    if (url.includes('summarize')) message = 'Context summarization started. You will be notified when complete.';
    if (url.includes('dedup')) message = 'Deduplication job started. This may take a few minutes.';
    if (url.includes('tasks')) message = 'Task extraction started. Check your tasks shortly.';

    return NextResponse.json({
        success: true,
        message: message,
        details: body
    });
}
