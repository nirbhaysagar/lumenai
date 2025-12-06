import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

export async function extractFromImage(buffer: Buffer): Promise<{ text: string }> {
    try {
        let model;

        // Check for Groq Key (explicit or via OPENAI_API_KEY if it looks like a Groq key)
        const groqKey = process.env.GROQ_API_KEY || (process.env.OPENAI_API_KEY?.startsWith('gsk_') ? process.env.OPENAI_API_KEY : undefined);

        if (groqKey) {
            console.log('Using Groq Vision (Llama-3.2-11b)...');
            const groq = createOpenAI({
                baseURL: 'https://api.groq.com/openai/v1',
                apiKey: groqKey,
            });
            model = groq('llama-3.2-11b-vision-instruct');
        } else if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
            console.log('Using OpenAI Vision (GPT-4o)...');
            const openai = createOpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            model = openai('gpt-4o');
        } else {
            throw new Error('No valid API key found for Vision (Groq or OpenAI)');
        }

        const { text } = await generateText({
            model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Transcribe ALL text from this image verbatim. If there is handwriting, transcribe it exactly. Do not add any conversational filler.' },
                        { type: 'image', image: buffer }
                    ],
                },
            ],
        });

        console.log('Vision LLM extraction complete.');
        return { text: text.trim() };
    } catch (error) {
        console.error('Error extracting text from image with Vision LLM:', error);
        throw error;
    }
}
