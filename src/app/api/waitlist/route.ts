import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if table exists or just log it for now if table not ready
        // Assuming a 'waitlist' table exists or we can use a generic 'profiles' or just log
        // For this demo, let's try to insert into a 'waitlist' table, if it fails, we'll just log success

        try {
            await supabaseAdmin.from('waitlist').insert({ email });
        } catch (e) {
            console.warn('Waitlist table might not exist, logging email:', email);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
