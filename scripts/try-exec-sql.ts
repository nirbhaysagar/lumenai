import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testExecSql() {
    console.log('Testing exec_sql...');
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error) {
        console.error('❌ exec_sql failed:', error.message);
    } else {
        console.log('✅ exec_sql succeeded:', data);
    }
}

testExecSql();
