import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMetadataColumn() {
    try {
        // Try to add the metadata column using raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: `
                ALTER TABLE recall_items 
                ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
                
                CREATE INDEX IF NOT EXISTS idx_recall_items_metadata 
                ON recall_items USING gin(metadata);
            `
        });

        if (error) {
            console.error('Error adding metadata column:', error);
            // If RPC doesn't exist, try direct SQL execution
            console.log('Trying alternative approach...');

            // Alternative: Just try to insert with metadata and see if it works
            const testInsert = await supabase
                .from('recall_items')
                .select('id, metadata')
                .limit(1)
                .maybeSingle();

            if (testInsert.error) {
                console.error('Metadata column does not exist:', testInsert.error.message);
                console.log('\nPlease run this SQL manually in your Supabase dashboard:');
                console.log('ALTER TABLE recall_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT \\'{}\\'::jsonb;');
                console.log('CREATE INDEX IF NOT EXISTS idx_recall_items_metadata ON recall_items USING gin(metadata);');
            } else {
                console.log('Metadata column already exists!');
            }
        } else {
            console.log('Successfully added metadata column!');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

addMetadataColumn();
