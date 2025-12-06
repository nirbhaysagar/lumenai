
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGroq() {
    console.log('Testing Groq API...');

    if (!process.env.GROQ_API_KEY) {
        console.error('❌ GROQ_API_KEY is missing from environment variables.');
        return;
    }

    const openai = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
    });

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello, are you working?' }],
            model: 'llama-3.1-8b-instant',
        });

        console.log('✅ Groq Response:', completion.choices[0].message.content);
    } catch (error: any) {
        console.error('❌ Groq API Error:', error.message);
    }
}

testGroq();
