import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../src/lib/supabase';

async function createTestUser() {
    const userId = '11111111-1111-1111-1111-111111111111';
    const email = 'test@lumen.ai';

    console.log(`Attempting to create user: ${userId}`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        id: userId,
        email: email,
        email_confirm: true,
        password: 'password123',
        user_metadata: { name: 'Test User' }
    });

    if (error && error.code !== 'email_exists') {
        console.error('Error creating auth user:', error);
        return;
    }

    if (!error) {
        console.log('Auth user created successfully:', data.user.id);
    } else {
        console.log('Auth user already exists, proceeding to check public user...');
    }

    // Also insert into public.users if it exists
    const { error: publicError } = await supabaseAdmin
        .from('users')
        .insert({
            id: userId,
            email: email,
            // full_name: 'Test User',
            // Add other fields if necessary, usually just id/email/name
        });

    if (publicError) {
        console.error('Error creating public user:', publicError);
    } else {
        console.log('Public user created successfully');
    }
}


createTestUser();
