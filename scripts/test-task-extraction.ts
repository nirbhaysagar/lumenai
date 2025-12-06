
import { Worker, Queue } from 'bullmq';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testTaskExtraction() {
    // Import Supabase AFTER env vars are loaded
    const { supabaseAdmin } = await import('../src/lib/supabase');
    const { getRedisConnection } = await import('../src/lib/redis');

    console.log('--- Testing Task Extraction ---');

    const userId = '356b3af3-1553-4bbc-844d-17b407b0de08';
    const contextId = 'cef70199-dae1-4885-831e-b7bbc87c7d35'; // Use an existing context ID if possible

    // 1. Insert a dummy "Assistant" message that contains tasks
    // The worker only looks at assistant messages or analyzes the conversation ending with one.
    const messageContent = `Here are the new action items for the demo:
1. Review the "Task Extractor" feature in the sidebar.
2. Confirm that this task appears in the list.
3. Mark this task as done to test interactivity.`;

    const { data: message, error: msgError } = await supabaseAdmin
        .from('messages')
        .insert({
            user_id: userId,
            context_id: contextId,
            role: 'assistant',
            content: messageContent,
        })
        .select()
        .single();

    if (msgError) {
        console.error('Failed to insert test message:', msgError);
        return;
    }
    console.log('Inserted test message:', message.id);

    // 2. Trigger the Task Extractor Job
    console.log('Triggering Task Extractor Job...');
    const connection = getRedisConnection();
    const taskQueue = new Queue('task_extractor', { connection });

    const job = await taskQueue.add('extract', {
        messageId: message.id,
        userId,
        contextId,
    });
    console.log('Job added:', job.id);

    // 3. Poll for results
    console.log('Waiting for tasks to be extracted...');
    let attempts = 0;
    while (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const { data: tasks, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('message_id', message.id);

        if (taskError) {
            console.error('Error fetching tasks:', taskError);
            break;
        }

        if (tasks && tasks.length > 0) {
            console.log(`✅ Success! Found ${tasks.length} tasks:`);
            tasks.forEach(t => {
                console.log(`- [${t.priority}] ${t.content} (Status: ${t.status})`);
            });
            break;
        } else {
            console.log(`[Attempt ${attempts}] No tasks yet...`);
        }
    }

    await taskQueue.close();
    // connection.quit(); // Don't quit shared connection if reused, but here it's fine
    process.exit(0);
}

testTaskExtraction();
