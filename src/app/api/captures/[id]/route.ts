import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // Fetch capture details
        const { data: capture, error: captureError } = await supabaseAdmin
            .from('captures')
            .select('*')
            .eq('id', id)
            .single();

        if (captureError) throw captureError;

        // Fetch chunks for this capture
        const { data: chunks, error: chunksError } = await supabaseAdmin
            .from('chunks')
            .select('*')
            .eq('capture_id', id)
            .order('id', { ascending: true }); // Assuming sequential IDs or add a sequence field

        if (chunksError) throw chunksError;

        return NextResponse.json({ capture, chunks });
    } catch (error: any) {
        console.error('Failed to fetch capture details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
