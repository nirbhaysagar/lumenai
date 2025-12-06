import { supabaseAdmin } from '../src/lib/supabase';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupStorage() {
    console.log('Setting up Supabase Storage...');

    const bucketName = 'uploads';

    try {
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

        if (listError) {
            console.error('Error listing buckets:', listError);
            return;
        }

        const bucketExists = buckets.find(b => b.name === bucketName);

        if (bucketExists) {
            console.log(`Bucket '${bucketName}' already exists.`);
        } else {
            console.log(`Creating bucket '${bucketName}'...`);
            const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
            });

            if (createError) {
                console.error('Error creating bucket:', createError);
                return;
            }
            console.log(`Bucket '${bucketName}' created successfully.`);
        }

        // Verify public access (policy might be needed if not auto-created)
        // For now, 'public: true' in createBucket should suffice for basic public read.

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupStorage();
