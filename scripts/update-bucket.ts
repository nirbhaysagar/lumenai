
import { supabaseAdmin } from '../src/lib/supabase';

async function updateBucket() {
    console.log('Updating "uploads" bucket configuration...');

    try {
        const { data, error } = await supabaseAdmin
            .storage
            .updateBucket('uploads', {
                public: true,
                allowedMimeTypes: null, // Allow all
                fileSizeLimit: 52428800 // 50MB
            });

        if (error) {
            console.error('Failed to update bucket:', error);
        } else {
            console.log('Bucket updated successfully:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

updateBucket();
