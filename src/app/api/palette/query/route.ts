import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { query, contextId } = await req.json();

        // Phase 1: Mock response
        // In Phase 2, this will call the RAG pipeline

        await new Promise(r => setTimeout(r, 1000)); // Simulate latency

        return NextResponse.json({
            answer: `This is a simulated answer for "${query}". In Phase 2, this will be connected to the RAG engine.`,
            sources: [
                { id: '1', captureId: 'cap_1', snippet: '...relevant text snippet...', score: 0.9 },
            ],
            followups: [
                { action: 'chat', label: 'Open full chat' }
            ]
        });

    } catch (error) {
        return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }
}
