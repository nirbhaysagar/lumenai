
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testChatHistory() {
    // Import Supabase AFTER env vars are loaded
    const { supabaseAdmin } = await import('../src/lib/supabase');

    console.log('--- Testing Chat History API ---');

    // 1. Get a user ID (using the one from debug logs)
    const userId = '356b3af3-1553-4bbc-844d-17b407b0de08';

    // 2. Insert a dummy message to ensure there is something to fetch
    const { data: insertedMsg, error: insertError } = await supabaseAdmin
        .from('messages')
        .insert({
            user_id: userId,
            role: 'user',
            content: 'Test message for history persistence',
            context_id: null // Global
        })
        .select()
        .single();

    if (insertError) {
        console.error('Failed to insert test message:', insertError);
        return;
    }
    console.log('Inserted test message:', insertedMsg.id);

    // 3. Fetch messages using the logic we added to the API (simulated)
    // We can't call the API route directly from a script easily without running the server and fetch,
    // but we can replicate the query logic to verify it works against the DB.

    console.log('Fetching messages from DB...');
    const { data: messages, error: fetchError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .is('context_id', null) // Global context
        .order('created_at', { ascending: true });

    if (fetchError) {
        console.error('Failed to fetch messages:', fetchError);
    } else {
        console.log(`Fetched ${messages.length} messages.`);
        const found = messages.find(m => m.id === insertedMsg.id);
        if (found) {
            console.log('✅ Successfully retrieved the inserted message.');
        } else {
            console.error('❌ Could not find the inserted message in the fetch result.');
        }
    }

    // Clean up
    await supabaseAdmin.from('messages').delete().eq('id', insertedMsg.id);
    console.log('Cleaned up test message.');
}

testChatHistory();
