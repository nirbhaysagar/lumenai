import * as dotenv from 'dotenv';
import path from 'path';

const envConfig = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (envConfig.error) {
    console.error('Error loading .env.local:', envConfig.error);
} else if (envConfig.parsed) {
    console.log('Available environment variables:', Object.keys(envConfig.parsed).join(', '));
} else {
    console.log('No variables parsed');
}
