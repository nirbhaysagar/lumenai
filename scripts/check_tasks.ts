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

async function checkTasks() {
    const userId = '00000000-0000-0000-0000-000000000000'; // DEMO_USER_ID

    console.log(`Checking tasks for user: ${userId}`);

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Failed to fetch tasks:', error);
    } else {
        console.log(`Found ${tasks?.length} tasks:`);
        tasks?.forEach(t => console.log(`- [${t.status}] ${t.content}`));
    }
}

checkTasks();
