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

async function seedTags() {
    const tags = ['Tag1', 'Tag2', 'Important', 'Work', 'Personal'];

    for (const tag of tags) {
        const { error } = await supabase
            .from('tags')
            .upsert({ name: tag }, { onConflict: 'name' });

        if (error) {
            console.error(`Error inserting tag ${tag}:`, error);
        } else {
            console.log(`Inserted tag: ${tag}`);
        }
    }
}

seedTags();
