import { supabaseAdmin } from '@/lib/supabase';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DEMO_USER_ID = '356b3af3-1553-4bbc-844d-17b407b0de08';

async function testRecallSystem() {
    console.log('🧪 Testing Active Recall System...\n');

    // Get a real chunk ID from database
    console.log('0️⃣ Fetching a real chunk from database');
    let testChunkId: string | null = null;
    try {
        const { data: chunks, error } = await supabaseAdmin
            .from('chunks')
            .select('id, content')
            .eq('user_id', DEMO_USER_ID)
            .limit(1)
            .single();

        if (error || !chunks) {
            console.log('   ⚠️  No chunks found, creating test data...');
            // Create a test chunk
            const { data: newChunk, error: createError } = await supabaseAdmin
                .from('chunks')
                .insert({
                    user_id: DEMO_USER_ID,
                    content: 'Test content for recall system',
                    capture_id: '00000000-0000-0000-0000-000000000000'
                })
                .select()
                .single();

            if (createError || !newChunk) {
                console.error('   ❌ Failed to create test chunk:', createError);
                process.exit(1);
            }
            testChunkId = newChunk.id;
        } else {
            testChunkId = chunks.id;
        }
        console.log('   ✅ Using chunk ID:', testChunkId, '\n');
    } catch (error) {
        console.error('   ❌ Error:', error);
        process.exit(1);
    }

    // Test 1: Create a recall item
    console.log('1️⃣ Testing POST /api/recall/create');
    let createdItemId: string | null = null;
    try {
        const createResponse = await fetch('http://localhost:3000/api/recall/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: DEMO_USER_ID,
                chunkId: testChunkId,
                content: 'What is the capital of France?',
                note: 'Paris - the city of lights',
                delayDays: 1
            })
        });

        const createData = await createResponse.json();
        console.log('   Status:', createResponse.status);
        console.log('   Response:', JSON.stringify(createData, null, 2));

        if (createData.success) {
            console.log('   ✅ Recall item created successfully\n');
            createdItemId = createData.item.id;

            // Test 2: Try to create duplicate (same chunk)
            console.log('2️⃣ Testing duplicate prevention');
            const duplicateResponse = await fetch('http://localhost:3000/api/recall/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: DEMO_USER_ID,
                    chunkId: testChunkId, // Same chunk ID
                    content: 'Duplicate test',
                    delayDays: 1
                })
            });

            const duplicateData = await duplicateResponse.json();
            console.log('   Status:', duplicateResponse.status);
            console.log('   Response:', JSON.stringify(duplicateData, null, 2));

            if (duplicateResponse.status === 409) {
                console.log('   ✅ Duplicate prevention working\n');
            } else {
                console.log('   ❌ Duplicate prevention failed\n');
            }
        }
    } catch (error) {
        console.error('   ❌ Error:', error);
    }

    // Test 3: Get recall stats
    console.log('3️⃣ Testing GET /api/recall/stats');
    try {
        const statsResponse = await fetch(`http://localhost:3000/api/recall/stats?userId=${DEMO_USER_ID}`);
        const statsData = await statsResponse.json();
        console.log('   Status:', statsResponse.status);
        console.log('   Stats:', JSON.stringify(statsData, null, 2));
        console.log('   ✅ Stats endpoint working\n');
    } catch (error) {
        console.error('   ❌ Error:', error);
    }

    console.log('✨ Testing complete!');
    process.exit(0);
}

testRecallSystem().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
