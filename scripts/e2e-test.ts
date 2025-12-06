import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const DEMO_USER_ID = '356b3af3-1553-4bbc-844d-17b407b0de08';

// Manual Env Loading
function loadEnv(filename: string) {
    const filePath = path.resolve(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
        console.log(`Loaded ${filename}`);
    }
}

loadEnv('.env.local');
loadEnv('.env');

import { createClient } from '@supabase/supabase-js';

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
console.log('Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runE2ETest() {
    console.log('🚀 Starting End-to-End Test for Lumen...');

    // 0. Get Valid User ID
    let userId = DEMO_USER_ID;

    // Try fetching from existing captures first (guaranteed to be valid for captures table)
    const { data: existingCapture } = await supabaseAdmin.from('captures').select('user_id').limit(1).single();
    if (existingCapture && existingCapture.user_id) {
        userId = existingCapture.user_id;
        console.log(`Using existing user ID from captures table: ${userId}`);
    } else {
        // Fallback to auth.users
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        if (users && users.users.length > 0) {
            userId = users.users[0].id;
            console.log(`Using existing user ID from auth: ${userId}`);
        } else {
            console.warn(`No users found! Using DEMO_USER_ID: ${userId}`);
        }
    }

    // 1. Create a dummy file
    const testFilePath = path.resolve(__dirname, 'test-doc.txt');
    const testContent = `
    Lumen E2E Test Document
    Date: ${new Date().toISOString()}
    
    Lumen is a Second Brain AI. It uses a 3-Layer Memory Architecture:
    1. Raw Layer (Ingestion)
    2. Canonical Layer (Deduplication)
    3. Abstract Layer (Knowledge Graph)
    
    This test verifies that the pipeline connects all these layers.
    We expect to see a Summary in the Memories page and Nodes in the Graph page.
    `;
    fs.writeFileSync(testFilePath, testContent);

    try {
        // 2. Upload File
        console.log('\n📤 Uploading file...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('userId', userId);
        formData.append('type', 'file');

        const uploadRes = await fetch(`${BASE_URL}/api/ingest`, {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error('Upload Error Body:', errorText);
            throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        const captureId = uploadData.captureId;
        console.log(`✅ Upload successful! Capture ID: ${captureId}`);

        // 3. Poll for Completion
        console.log('\n⏳ Waiting for processing (Ingest -> Embed -> Dedup -> Graph/Summarize)...');
        let status = 'processing';
        let attempts = 0;
        const maxAttempts = 60; // 60 * 2s = 120s timeout

        while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;

            const statusRes = await fetch(`${BASE_URL}/api/captures/${captureId}`);
            const statusData = await statusRes.json();
            status = statusData.capture?.ingest_status;

            process.stdout.write(`.${status === 'processing' ? 'p' : status === 'queued' ? 'q' : status}`);
        }
        console.log('');

        if (status !== 'completed') {
            console.warn(`⚠️ Processing timed out or failed with status: ${status}.`);
            if (status === 'failed') {
                const statusRes = await fetch(`${BASE_URL}/api/captures/${captureId}`);
                const statusData = await statusRes.json();
                console.error('❌ Error Message:', statusData.capture?.error_message);
            }
            console.warn('Proceeding to verification anyway...');
        } else {
            console.log('✅ Processing completed!');
        }

        // 4. Verify Memories (Summarization)
        console.log('\n🧠 Verifying Memories (Summarization)...');
        let memoriesFound = false;
        attempts = 0;
        const maxMemoriesAttempts = 12; // 12 * 5s = 60s

        while (!memoriesFound && attempts < maxMemoriesAttempts) {
            attempts++;
            console.log(`   Polling memories (Attempt ${attempts}/${maxMemoriesAttempts})...`);
            await new Promise(r => setTimeout(r, 5000));

            try {
                const memoriesRes = await fetch(`${BASE_URL}/api/memories?userId=${userId}&limit=5`);
                const memoriesData = await memoriesRes.json();
                const memories = memoriesData.memories || memoriesData;

                if (memories && Array.isArray(memories) && memories.length > 0) {
                    const summary = memories.find((m: any) =>
                        m.type === 'summary' || // Some might just be type=summary
                        (m.target_type === 'capture' && m.target_id === captureId)
                    );
                    if (summary) {
                        console.log('✅ Summary found in Memories!');
                        console.log('   Summary Content:', summary.content.substring(0, 100) + '...');
                        memoriesFound = true;
                    }
                }
            } catch (e) {
                console.error('   Error fetching memories:', e);
            }
        }

        if (!memoriesFound) {
            console.error('❌ Summary NOT found in Memories after timeout.');
        }

        // 5. Verify Knowledge Graph
        console.log('\n🕸️ Verifying Knowledge Graph...');
        let graphFound = false;
        attempts = 0;

        while (!graphFound && attempts < maxAttempts) {
            attempts++;
            console.log(`   Polling graph (Attempt ${attempts}/${maxAttempts})...`);
            await new Promise(r => setTimeout(r, 5000));

            try {
                const graphRes = await fetch(`${BASE_URL}/api/graph?userId=${userId}`);
                const graphData = await graphRes.json();

                if (graphData.nodes && graphData.nodes.length > 0) {
                    const linksCount = graphData.links ? graphData.links.length : (graphData.edges ? graphData.edges.length : 0);
                    console.log(`✅ Knowledge Graph verified! Found ${graphData.nodes.length} nodes and ${linksCount} links.`);
                    graphFound = true;
                }
            } catch (e) {
                console.error('   Error fetching graph:', e);
            }
        }

        if (!graphFound) {
            console.error('❌ Graph is empty after timeout.');
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error);
    } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

runE2ETest();
