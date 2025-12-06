import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
    const { prompt, command, context } = await req.json();

    let systemPrompt = 'You are an AI writing assistant. You help the user write notes, articles, and documents.';
    let userPrompt = prompt;

    if (command === 'continue') {
        systemPrompt += ' Continue writing based on the context provided. Maintain the tone and style.';
        userPrompt = `Context: "${context}"\n\nContinue writing:`;
    } else if (command === 'summarize') {
        systemPrompt += ' Summarize the provided text concisely.';
        userPrompt = `Text to summarize: "${context}"`;
    } else if (command === 'fix') {
        systemPrompt += ' Fix grammar and spelling errors in the text. Return only the corrected text.';
        userPrompt = `Text to fix: "${context}"`;
    } else if (command === 'brainstorm') {
        systemPrompt += ' Provide a list of ideas based on the prompt.';
        userPrompt = `Topic: "${prompt}"\n\nIdeas:`;
    }

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
}
