import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Available Environment Variables:');
Object.keys(process.env).forEach(key => {
    if (key.includes('URL') || key.includes('KEY') || key.includes('DB') || key.includes('SUPABASE')) {
        console.log(key);
    }
});
