import { NextResponse } from 'next/server';

export async function GET() {
    // In a real implementation, we would connect to BullMQ here to get real stats.
    // For now, we return mocked data to demonstrate the UI.

    const stats = {
        queues: [
            { name: 'ingestion', active: 2, waiting: 5, failed: 0, completed: 124 },
            { name: 'deduplication', active: 0, waiting: 0, failed: 1, completed: 45 },
            { name: 'graph-builder', active: 1, waiting: 12, failed: 0, completed: 89 },
            { name: 'recall-scheduler', active: 0, waiting: 0, failed: 0, completed: 300 },
        ],
        workers: {
            ingestion: 'online',
            deduplication: 'online',
            graph: 'online',
            recall: 'idle'
        },
        systemInfo: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
        }
    };

    return NextResponse.json(stats);
}
