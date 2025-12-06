import { google } from 'googleapis';
import { supabaseAdmin } from './supabase';

export const getGoogleAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

export const getGoogleDriveClient = async (userId: string) => {
    // 1. Get tokens from DB
    const { data: integration, error } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

    if (error || !integration) {
        throw new Error('Google Drive not connected');
    }

    const oauth2Client = getGoogleAuthClient();
    oauth2Client.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        expiry_date: integration.expires_at ? new Date(integration.expires_at).getTime() : undefined,
    });

    // Handle token refresh if needed
    // googleapis handles this automatically if refresh_token is set, 
    // but we might want to listen to 'tokens' event to update DB.
    // For now, let's rely on the client's auto-refresh and manually update if we get new tokens.

    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            const updates: any = {
                access_token: tokens.access_token,
                updated_at: new Date().toISOString(),
            };
            if (tokens.refresh_token) {
                updates.refresh_token = tokens.refresh_token;
            }
            if (tokens.expiry_date) {
                updates.expires_at = new Date(tokens.expiry_date).toISOString();
            }

            await supabaseAdmin
                .from('integrations')
                .update(updates)
                .eq('user_id', userId)
                .eq('provider', 'google');
        }
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
};
