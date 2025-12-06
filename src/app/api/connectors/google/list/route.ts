import { getGoogleDriveClient } from '@/lib/google';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const drive = await getGoogleDriveClient(session.user.id);

        const response = await drive.files.list({
            pageSize: 20,
            fields: 'nextPageToken, files(id, name, mimeType, iconLink, webViewLink)',
            q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false",
            orderBy: 'modifiedTime desc'
        });

        return NextResponse.json({ files: response.data.files });

    } catch (error: any) {
        console.error('Drive List Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
