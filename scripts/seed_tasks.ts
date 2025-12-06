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

async function seedTasks() {
    const userId = '00000000-0000-0000-0000-000000000000'; // DEMO_USER_ID

    console.log(`Seeding tasks for user: ${userId}`);

    const tasks = [
        { content: "Review Q3 Financial Reports", status: "pending", priority: "high" },
        { content: "Schedule team sync for Project Alpha", status: "pending", priority: "medium" },
        { content: "Update website landing page copy", status: "completed", priority: "low" },
        { content: "Buy groceries for the week", status: "pending", priority: "low" },
        { content: "Call mom", status: "pending", priority: "high" }
    ];

    for (const task of tasks) {
        const { error } = await supabase.from('tasks').insert({
            user_id: userId,
            ...task
        });

        if (error) {
            console.error('Failed to insert task:', error);
        } else {
            console.log(`Inserted task: ${task.content}`);
        }
    }
}

seedTasks();
