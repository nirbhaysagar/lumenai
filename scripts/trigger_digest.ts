import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerDigest() {
    const userId = '00000000-0000-0000-0000-000000000000'; // DEMO_USER_ID

    console.log(`Triggering digest for user: ${userId}`);

    // Mock content since we might not have enough data for the LLM to work well in this test env
    const mockDigest = {
        greeting: "Good Morning, Ajay!",
        summary: "You captured 3 new ideas yesterday about AI agents and memory systems. Great progress!",
        focus: "Today, focus on implementing the Notifications system to keep users engaged.",
        memory: "Remember when you first designed the 3-layer memory architecture? It's coming together nicely."
    };

    const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'digest',
        title: 'Your Daily Digest',
        content: mockDigest,
        is_read: false
    });

    if (error) {
        console.error('Failed to insert digest notification:', error);
    } else {
        console.log('Successfully inserted digest notification.');
    }
}

triggerDigest();
