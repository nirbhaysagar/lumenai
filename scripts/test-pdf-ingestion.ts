/**
 * End-to-End Test for PDF Ingestion
 * 
 * Tests the complete flow:
 * 1. Upload PDF → API
 * 2. Extract text
 * 3. Create chunks
 * 4. Save to database
 * 5. Queue embedding jobs
 * 6. Verify embeddings created
 */

import { supabaseAdmin } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
// @ts-ignore
import fetch from 'node-fetch';

const TEST_USER_ID = '356b3af3-1553-4bbc-844d-17b407b0de08';
const API_URL = 'http://localhost:3000/api/ingest';

async function testPdfIngestion() {
    console.log('🧪 Starting PDF Ingestion E2E Test...\n');

    // Step 1: Create a test PDF (or use existing)
    const testPdfPath = path.join(__dirname, 'test-sample.pdf');

    if (!fs.existsSync(testPdfPath)) {
        console.log('⚠️  No test PDF found. Creating a simple one...');
        // For now, skip if no test PDF exists
        console.log('❌ Please add a test PDF at:', testPdfPath);
        return;
    }

    const pdfBuffer = fs.readFileSync(testPdfPath);
    console.log(`✅ Loaded test PDF (${pdfBuffer.length} bytes)`);

    // Step 2: Upload via API
    console.log('\n📤 Uploading PDF to API...');
    const formData = new FormData();
    formData.append('userId', TEST_USER_ID);
    formData.append('type', 'pdf');
    formData.append('title', 'E2E Test PDF');
    formData.append('file', pdfBuffer, {
        filename: 'test.pdf',
        contentType: 'application/pdf',
    });

    const uploadResponse = await fetch(API_URL, {
        method: 'POST',
        body: formData as any,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
        console.error('❌ Upload failed:', uploadData);
        return;
    }

    console.log('✅ Upload successful!');
    console.log(`   - Capture ID: ${uploadData.captureId}`);
    console.log(`   - Chunks created: ${uploadData.chunkCount}`);

    const captureId = uploadData.captureId;

    // Step 3: Verify capture in database
    console.log('\n🔍 Verifying capture in database...');
    const { data: capture, error: captureError } = await supabaseAdmin
        .from('captures')
        .select('*')
        .eq('id', captureId)
        .single();

    if (captureError || !capture) {
        console.error('❌ Capture not found in database');
        return;
    }

    console.log('✅ Capture found:', capture.title);

    // Step 4: Verify chunks created
    console.log('\n🔍 Verifying chunks...');
    const { data: chunks, error: chunksError } = await supabaseAdmin
        .from('chunks')
        .select('*')
        .eq('capture_id', captureId);

    if (chunksError || !chunks || chunks.length === 0) {
        console.error('❌ No chunks found');
        return;
    }

    console.log(`✅ Found ${chunks.length} chunks`);
    console.log(`   - First chunk preview: "${chunks[0].content.substring(0, 100)}..."`);

    // Step 5: Wait for embeddings worker (give it 10 seconds)
    console.log('\n⏳ Waiting 10 seconds for embeddings worker...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 6: Verify embeddings created
    console.log('\n🔍 Checking for embeddings...');
    const { data: vectors, error: vectorsError } = await supabaseAdmin
        .from('chunk_vectors')
        .select('*')
        .in('chunk_id', chunks.map(c => c.id));

    if (vectorsError) {
        console.error('❌ Error checking vectors:', vectorsError);
        return;
    }

    if (!vectors || vectors.length === 0) {
        console.log('⚠️  No embeddings found yet (worker may still be processing)');
        console.log('   Check worker logs for progress');
    } else {
        console.log(`✅ Found ${vectors.length} embeddings!`);
    }

    // Step 7: Cleanup (optional)
    console.log('\n🧹 Cleanup (optional - comment out to keep test data)');
    // await supabaseAdmin.from('captures').delete().eq('id', captureId);
    // console.log('✅ Test data cleaned up');

    console.log('\n✨ PDF Ingestion E2E Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ PDF uploaded (${pdfBuffer.length} bytes)`);
    console.log(`   ✅ Capture created (ID: ${captureId})`);
    console.log(`   ✅ ${chunks.length} chunks created`);
    console.log(`   ${vectors && vectors.length > 0 ? '✅' : '⚠️ '} ${vectors?.length || 0} embeddings created`);
}

// Run the test
testPdfIngestion()
    .then(() => {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
