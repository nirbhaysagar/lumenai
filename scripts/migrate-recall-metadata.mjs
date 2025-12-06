import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Attempting to add metadata column to recall_items table...');

// The approach here is to try a test query first
async function testMetadataColumn() {
    const { data, error } = await supabase
        .from('recall_items')
        .select('id, metadata')
        .limit(1)
        .maybeSingle();

    if (error) {
        if (error.message.includes('column') && error.message.includes('metadata')) {
            console.log('❌ Metadata column does not exist');
            console.log('\n📝 Please run this SQL in your Supabase dashboard:');
            console.log('─'.repeat(60));
            console.log("ALTER TABLE recall_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;");
            console.log('CREATE INDEX IF NOT EXISTS idx_recall_items_metadata ON recall_items USING gin(metadata);');
            console.log('─'.repeat(60));
            return false;
        } else {
            console.error('Unexpected error:', error);
            return false;
        }
    } else {
        console.log('✅ Metadata column already exists!');
        if (data) {
            console.log('Sample metadata:', data.metadata || '{}');
        }
        return true;
    }
}

testMetadataColumn();
