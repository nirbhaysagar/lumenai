import { getGoogleAuthClient } from '@/lib/google';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        // 1. Get User Session
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Exchange code for tokens
        const oauth2Client = getGoogleAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        // 3. Store tokens in DB
        const { error: dbError } = await supabaseAdmin
            .from('integrations')
            .upsert({
                user_id: session.user.id,
                provider: 'google',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token, // Might be undefined if not first time consent
                expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, provider'
            });

        if (dbError) {
            console.error('DB Error storing tokens:', dbError);
            return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
        }

        // 4. Redirect back to app
        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (err: any) {
        console.error('Auth Callback Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
