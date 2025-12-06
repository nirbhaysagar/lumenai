
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLatestTasks() {
    const { supabaseAdmin } = await import('../src/lib/supabase');
    console.log('--- Checking Latest Tasks ---');
    const { data: tasks, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (tasks.length === 0) {
        console.log('No tasks found.');
    } else {
        tasks.forEach(t => {
            console.log(`[${t.created_at}] ${t.content} (Context: ${t.context_id})`);
        });
    }
}

checkLatestTasks();
