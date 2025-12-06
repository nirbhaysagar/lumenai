
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectTable() {
    const { supabaseAdmin } = await import('../src/lib/supabase');
    console.log('--- Inspecting Memories Table ---');
    // We can't directly query schema via JS client easily without admin rights or specific SQL function.
    // Instead, I'll select one row and print keys.
    const { data, error } = await supabaseAdmin
        .from('chunks')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('Table is empty or not found.');
    }
}

inspectTable();
