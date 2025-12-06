import { getGoogleDriveClient } from '@/lib/google';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ingestQueue } from '@/lib/queue';

export async function POST(request: Request) {
    try {
        const { fileId } = await request.json();
        if (!fileId) return NextResponse.json({ error: 'No fileId' }, { status: 400 });

        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const drive = await getGoogleDriveClient(session.user.id);

        // 1. Get file metadata
        const fileMeta = await drive.files.get({ fileId, fields: 'name, mimeType' });
        const fileName = fileMeta.data.name || 'drive-file';
        const mimeType = fileMeta.data.mimeType || 'application/octet-stream';

        // 2. Download file
        // For Google Docs/Sheets, we need to export them. For binaries (PDF), we get media.
        let stream;
        let ext = 'pdf'; // default

        if (mimeType.includes('application/vnd.google-apps.document')) {
            // Export Google Doc as PDF (or text/plain)
            const res = await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'stream' });
            stream = res.data;
            ext = 'pdf';
        } else if (mimeType.includes('application/vnd.google-apps.spreadsheet')) {
            const res = await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'stream' });
            stream = res.data;
            ext = 'pdf';
        } else {
            // Binary download
            const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
            stream = res.data;
            // Try to infer ext
            if (fileName.includes('.')) ext = fileName.split('.').pop() || 'bin';
        }

        // 3. Upload to Supabase Storage
        // We need to consume the stream into a buffer for Supabase upload (node client)
        // Or use the stream directly if supported. Supabase JS client supports Blob/File/Buffer.
        // Let's convert stream to buffer.
        const chunks: any[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const fileKey = `${session.user.id}/${Date.now()}-${fileName}`;
        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('uploads')
            .upload(fileKey, buffer, {
                contentType: mimeType.startsWith('application/vnd.google-apps') ? 'application/pdf' : mimeType,
                upsert: true
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 4. Create Capture Record
        const { data: capture, error: captureError } = await supabaseAdmin
            .from('captures')
            .insert({
                user_id: session.user.id,
                type: 'file', // ingest worker will normalize this based on extension
                title: fileName,
                file_path: fileKey, // Legacy field? Ingest worker uses fileKey from job data
                ingest_status: 'pending'
            })
            .select()
            .single();

        if (captureError) throw new Error(`Capture creation failed: ${captureError.message}`);

        // 5. Queue Ingest Job
        await ingestQueue.add('process_file', {
            captureId: capture.id,
            userId: session.user.id,
            type: 'file',
            fileKey: fileKey,
            title: fileName
        });

        return NextResponse.json({ success: true, captureId: capture.id });

    } catch (error: any) {
        console.error('Drive Ingest Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
