
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ingestQueue } from '@/lib/queue';

export async function POST(req: Request) {
    console.log('Ingest API called');
    try {
        const contentType = req.headers.get('content-type') || '';
        console.log('Content-Type:', contentType);

        let userId = '';
        let contextId = '';
        let teamId = '';
        let type = '';
        let title = '';
        let text = '';
        let url = '';
        let fileBuffer: Buffer | null = null;
        let fileName = '';

        let chunkStrategy = 'balanced';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            userId = formData.get('userId') as string;
            type = formData.get('type') as string;
            title = formData.get('title') as string;
            text = formData.get('text') as string;
            url = formData.get('url') as string;
            contextId = formData.get('contextId') as string;
            teamId = formData.get('teamId') as string;
            chunkStrategy = (formData.get('chunkStrategy') as string) || 'balanced';
            const file = formData.get('file') as File;
            if (file) fileName = file.name;
            console.log('FormData received:', { userId, type, title, textLength: text?.length, url, contextId, chunkStrategy });

            if (file) {
                const arrayBuffer = await file.arrayBuffer();
                fileBuffer = Buffer.from(arrayBuffer);
            }
        } else {
            const json = await req.json();
            userId = json.userId;
            type = json.type;
            title = json.title;
            text = json.text;
            url = json.url;
            contextId = json.contextId;
            teamId = json.teamId;
            chunkStrategy = json.chunkStrategy || 'balanced';

            if (json.image) {
                const matches = json.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (matches && matches.length === 3) {
                    fileBuffer = Buffer.from(matches[2], 'base64');
                }
            }
        }

        // Normalize generic 'file' type based on extension if available
        if (type === 'file' && fileName) {
            const ext = fileName.split('.').pop()?.toLowerCase();
            if (ext === 'pdf') type = 'pdf';
            else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) type = 'image';
            else if (['mp3', 'wav', 'm4a', 'mp4'].includes(ext || '')) type = 'audio'; // Note: video usually mp4, but let's assume audio for now or check mime
            else if (['mp4', 'mov', 'avi'].includes(ext || '')) type = 'video';
            else if (['doc', 'docx'].includes(ext || '')) type = 'document';
            console.log(`Normalized generic file type to: ${type}`);
        }

        let sourceUrl = url || '';
        let finalTitle = title || 'Untitled Capture';
        let fileKey = '';

        // Upload file to storage if present
        if (fileBuffer && (type === 'pdf' || type === 'image' || type === 'audio' || type === 'video' || type === 'document' || type === 'file')) {
            let fileExt = 'bin';
            if (type === 'pdf') fileExt = 'pdf';
            else if (type === 'image') fileExt = 'png';
            else if (type === 'audio') fileExt = 'mp3';
            else if (type === 'video') fileExt = 'mp4';
            else if (type === 'document') {
                fileExt = 'docx';
                if (fileName) {
                    const parts = fileName.split('.');
                    if (parts.length > 1) fileExt = parts.pop()?.toLowerCase() || 'docx';
                }
            }
            else if (type === 'file') {
                fileExt = 'bin';
                if (fileName) {
                    const parts = fileName.split('.');
                    if (parts.length > 1) fileExt = parts.pop()?.toLowerCase() || 'bin';
                }
            }

            const storageFileName = `${userId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('uploads')
                .upload(storageFileName, fileBuffer, {
                    contentType: 'application/octet-stream',
                    upsert: false
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                return NextResponse.json({
                    error: 'Failed to upload file to storage',
                    details: uploadError.message || String(uploadError)
                }, { status: 500 });
            } else {
                const { data: { publicUrl } } = supabaseAdmin
                    .storage
                    .from('uploads')
                    .getPublicUrl(storageFileName);

                sourceUrl = publicUrl;
                fileKey = storageFileName;
                console.log('File uploaded to:', sourceUrl);
            }
        }


        // Insert Capture with status 'uploaded' (or 'queued')
        const { data: capture, error: captureError } = await supabaseAdmin
            .from('captures')
            .insert({
                user_id: userId,
                type,
                title: finalTitle,
                source_url: sourceUrl,
                raw_text: '', // Will be filled by worker
                ingest_status: 'pending', // Changed from queued to pending to match likely enum
                team_id: teamId || null,
            })
            .select()
            .single();

        if (captureError) {
            console.error('Capture insert error:', captureError);
            return NextResponse.json({
                error: 'Failed to create capture',
                details: captureError.message || String(captureError)
            }, { status: 500 });
        }

        // Enqueue Job
        console.log('Enqueuing job to ingestQueue:', ingestQueue);
        if (!ingestQueue) {
            throw new Error('ingestQueue is undefined! Check lib/queue.ts export.');
        }

        try {
            await ingestQueue.add('ingest_job', {
                captureId: capture.id,
                userId,
                type,
                fileKey,
                url,
                text,
                title: finalTitle,
                contextId,
                chunkStrategy
            });
            console.log('Job enqueued successfully');
        } catch (queueError: any) {
            console.error('Failed to enqueue job:', queueError);
            throw new Error(`Queue error: ${queueError.message}`);
        }

        return NextResponse.json({
            success: true,
            captureId: capture.id,
            message: 'Ingestion queued successfully'
        });

    } catch (error: any) {
        console.error('Ingest API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message || String(error),
            stack: error.stack
        }, { status: 500 });
    }
}
