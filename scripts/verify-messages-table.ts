
import { supabaseAdmin } from '../src/lib/supabase';

async function verifyMessagesTable() {
    console.log('Verifying messages table...');

    const userId = '356b3af3-1553-4bbc-844d-17b407b0de08'; // Hardcoded test user

    try {
        // 1. Try to insert a test message
        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert({
                user_id: userId,
                role: 'user',
                content: 'Test message from verification script',
                context_id: null
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Insert Failed:', error.message);
            return;
        }

        console.log('✅ Insert Success! Message ID:', data.id);

        // 2. Clean up
        const { error: deleteError } = await supabaseAdmin
            .from('messages')
            .delete()
            .eq('id', data.id);

        if (deleteError) {
            console.error('⚠️ Cleanup Failed:', deleteError.message);
        } else {
            console.log('✅ Cleanup Success!');
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
    }
}

verifyMessagesTable();
