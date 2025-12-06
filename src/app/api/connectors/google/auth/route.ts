import { getGoogleAuthClient } from '@/lib/google';
import { NextResponse } from 'next/server';

export async function GET() {
    const oauth2Client = getGoogleAuthClient();

    const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important for refresh token
        scope: scopes,
        prompt: 'consent' // Force consent to ensure we get a refresh token
    });

    return NextResponse.redirect(url);
}
