
import { supabaseAdmin } from '../src/lib/supabase';

async function verifyStorage() {
    console.log('Verifying Supabase Storage...');

    const bucketName = 'uploads';
    const testFileName = `test-verify-${Date.now()}.docx`;
    // Minimal valid DOCX is complex, using a dummy buffer with correct MIME type to test permissions
    const fileContent = Buffer.from('Dummy DOCX content');

    try {
        // 1. Upload File
        console.log('Uploading test file...');
        const { error: uploadError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .upload(testFileName, fileContent, {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload Failed:', uploadError);
            return;
        }
        console.log('Upload Success!');

        // 2. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from(bucketName)
            .getPublicUrl(testFileName);

        console.log('Public URL:', publicUrl);

        // 3. Verify Access
        console.log('Verifying public access...');
        const response = await fetch(publicUrl);

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength === fileContent.length) {
                console.log('SUCCESS: Bucket is public and file is accessible.');
            } else {
                console.error('FAILURE: File content mismatch.');
            }
        } else {
            console.error(`FAILURE: Public access denied. Status: ${response.status} ${response.statusText}`);
            console.log('Please ensure the "uploads" bucket is set to PUBLIC in Supabase Dashboard.');
        }

        // Cleanup
        await supabaseAdmin.storage.from(bucketName).remove([testFileName]);

    } catch (error) {
        console.error('Verification Error:', error);
    }
}

verifyStorage();
