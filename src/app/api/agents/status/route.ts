import { NextResponse } from 'next/server';
import { embeddingsQueue, topicerQueue, dedupQueue, summarizerQueue, taskExtractorQueue, graphQueue, recallQueue } from '@/lib/queue';

export async function GET() {
    try {
        const queues = [
            { name: 'Embeddings', queue: embeddingsQueue, id: 'embeddings' },
            { name: 'Topic Modeler', queue: topicerQueue, id: 'topicer' },
            { name: 'Deduplication', queue: dedupQueue, id: 'dedup' },
            { name: 'Summarizer', queue: summarizerQueue, id: 'summarizer' },
            { name: 'Task Extractor', queue: taskExtractorQueue, id: 'task_extractor' },
            { name: 'Graph Extractor', queue: graphQueue, id: 'graph' },
            { name: 'Recall Manager', queue: recallQueue, id: 'recall' },
        ];

        const stats = await Promise.all(queues.map(async (q) => {
            if (!q.queue) return null;

            const counts = await q.queue.getJobCounts('active', 'waiting', 'completed', 'failed');
            const isPaused = await q.queue.isPaused();

            return {
                id: q.id,
                name: q.name,
                status: isPaused ? 'paused' : (counts.active > 0 ? 'working' : 'idle'),
                counts: {
                    active: counts.active,
                    waiting: counts.waiting,
                    completed: counts.completed,
                    failed: counts.failed
                }
            };
        }));

        return NextResponse.json({
            agents: stats.filter(Boolean),
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Agent Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { agentId, action } = await req.json();

        let queue;
        switch (agentId) {
            case 'embeddings': queue = embeddingsQueue; break;
            case 'topicer': queue = topicerQueue; break;
            case 'dedup': queue = dedupQueue; break;
            case 'summarizer': queue = summarizerQueue; break;
            case 'task_extractor': queue = taskExtractorQueue; break;
            case 'graph': queue = graphQueue; break;
            case 'recall': queue = recallQueue; break;
            default: return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
        }

        if (action === 'pause') {
            await queue.pause();
        } else if (action === 'resume') {
            await queue.resume();
        } else if (action === 'clean') {
            await queue.clean(0, 0, 'completed');
            await queue.clean(0, 0, 'failed');
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
