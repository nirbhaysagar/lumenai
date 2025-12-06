import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../src/lib/supabase';

async function checkUser() {
    const email = 'test@lumen.ai';
    console.log(`Checking for user with email: ${email}`);

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log('User found:', data);
    }
}

checkUser();
