import { NextResponse } from 'next/server';

// Mock storage for config (in memory for now, would be DB in prod)
let config = {
    enableOCR: true,
    enableYouTube: false,
    enableLocalEmbeddings: false,
    logLevel: 'info'
};

export async function GET() {
    return NextResponse.json(config);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        config = { ...config, ...body };
        return NextResponse.json({ success: true, config });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
