import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('No database connection string found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase usually requires SSL
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const query = `
            ALTER TABLE captures 
            ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE SET NULL;
        `;

        await client.query(query);
        console.log('Successfully added context_id column to captures table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

migrate();
