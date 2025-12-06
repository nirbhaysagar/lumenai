import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractFromAudio } from './audioExtractor';

// Helper to check if ffmpeg is available
// In a real production env, we'd use 'fluent-ffmpeg' or spawn a child process.
// For this implementation, we'll assume if we can't spawn it, we skip vision.
import { spawn } from 'child_process';

async function extractFrames(videoPath: string, outputDir: string, numFrames: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
        // Check if ffmpeg is available
        const check = spawn('ffmpeg', ['-version']);
        check.on('error', () => {
            console.warn('ffmpeg not found. Skipping vision analysis.');
            resolve([]);
        });

        check.on('close', (code) => {
            if (code !== 0) {
                resolve([]);
                return;
            }

            // ffmpeg is available, extract frames
            // ffmpeg -i input.mp4 -vf fps=1/60 out%d.jpg
            // We'll just take 5 frames at fixed intervals for simplicity
            // But getting duration first is hard without ffprobe.
            // Let's just take frames at 10%, 30%, 50%, 70%, 90% timestamps? 
            // Without duration, we can't know timestamps.
            // Alternative: use vf fps=1/10 to get a frame every 10 seconds.

            const framePattern = path.join(outputDir, 'frame-%03d.jpg');
            // Extract 1 frame every 30 seconds
            const ffmpeg = spawn('ffmpeg', [
                '-i', videoPath,
                '-vf', 'fps=1/30',
                framePattern
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    const files = fs.readdirSync(outputDir)
                        .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
                        .map(f => path.join(outputDir, f));
                    // Limit to numFrames
                    resolve(files.slice(0, numFrames));
                } else {
                    console.error('ffmpeg failed to extract frames');
                    resolve([]);
                }
            });
        });
    });
}

export async function extractFromVideo(fileBuffer: Buffer, fileExtension: string): Promise<{ text: string }> {
    const tempDir = os.tmpdir();
    const baseName = `video-${Date.now()}`;
    const tempFilePath = path.join(tempDir, `${baseName}.${fileExtension}`);
    const framesDir = path.join(tempDir, `${baseName}-frames`);

    try {
        fs.writeFileSync(tempFilePath, fileBuffer);

        // 1. Audio Transcription (using Groq via audioExtractor)
        // Groq accepts video files for transcription directly.
        console.log('🎥 Extracting Audio Transcript...');
        const { text: transcript } = await extractFromAudio(fileBuffer, fileExtension);

        // 2. Vision Analysis (Optional)
        let visualSummary = '';

        // Create frames dir
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }

        const frames = await extractFrames(tempFilePath, framesDir);

        if (frames.length > 0) {
            console.log(`👁️ Analyzing ${frames.length} frames with Vision Model...`);

            // Initialize OpenAI (or compatible) for Vision
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY, // Use OpenAI for Vision as it's most reliable
            });

            const contentParts: any[] = [
                { type: "text", text: "These are frames from a video. Please provide a detailed visual summary of what is happening in the video." }
            ];

            for (const framePath of frames) {
                const imageBuffer = fs.readFileSync(framePath);
                const base64Image = imageBuffer.toString('base64');
                contentParts.push({
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`
                    }
                });
            }

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Cost-effective vision
                messages: [
                    {
                        role: "user",
                        content: contentParts,
                    },
                ],
                max_tokens: 500,
            });

            visualSummary = response.choices[0].message.content || '';
        }

        // Combine results
        let finalOutput = '';
        if (visualSummary) {
            finalOutput += `## 👁️ Visual Summary\n${visualSummary}\n\n`;
        }
        finalOutput += `## 🗣️ Transcript\n${transcript}`;

        return { text: finalOutput };

    } catch (error) {
        console.error('Video extraction error:', error);
        throw error;
    } finally {
        // Cleanup
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(framesDir)) {
            fs.rmSync(framesDir, { recursive: true, force: true });
        }
    }
}
