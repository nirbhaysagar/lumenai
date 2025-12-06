
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function extractFromAudio(fileBuffer: Buffer, fileExtension: string): Promise<{ text: string }> {
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${fileExtension}`);

    try {
        // Initialize OpenAI client with Groq configuration
        // Note: This requires GROQ_API_KEY to be set in environment variables
        const openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
        });

        // Write buffer to temp file because OpenAI SDK expects a file stream
        fs.writeFileSync(tempFilePath, fileBuffer);

        console.log(`Transcribing audio file with Groq (whisper-large-v3): ${tempFilePath}`);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-large-v3',
        });

        return { text: transcription.text };
    } catch (error) {
        console.error('Audio extraction error:', error);
        throw error;
    } finally {
        // Cleanup temp file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}
