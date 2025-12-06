import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';
import * as Sentry from '@sentry/node';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '@/lib/supabase';
import { extractFromPdf } from '@/lib/extractors/pdfExtractor';
import { extractFromImage } from '@/lib/extractors/imageExtractor';
import { extractFromUrl } from '@/lib/extractors/urlExtractor';
import { extractFromAudio } from '@/lib/extractors/audioExtractor';
import { extractFromDocument } from '@/lib/extractors/docExtractor';
import { chunkText } from '@/lib/chunkers/basicChunker';

import { embeddingsQueue, topicerQueue } from '@/lib/queue';

console.log('🚀 Starting Ingest Worker...');

export const processIngestJob = async (job: Job) => {
    let { captureId, userId, type, fileKey, url, text, title, contextId } = job.data;
    console.log(`Processing ingestion job for capture ${captureId}, type: ${type}`);

    // Dynamic import for summarizer to avoid circular dependency if possible, 
    // though embeddingsQueue is already imported statically so maybe it doesn't matter?
    // Let's try importing summarizerQueue dynamically just to be safe.
    const { summarizerQueue } = await import('@/lib/queue');

    try {
        // Update status to processing_download
        await supabaseAdmin.from('captures').update({ ingest_status: 'processing_download' }).eq('id', captureId);

        let finalContent = '';
        let finalTitle = title;

        // 1. Extract Content
        if (type === 'url' && url) {
            console.log('Extracting from URL:', url);
            const extracted = await extractFromUrl(url);
            finalContent = extracted.content;
            if (!finalTitle) finalTitle = extracted.title || 'Web Capture';
        } else if ((type === 'text' || type === 'tweet_thread' || type === 'article' || type === 'selection') && text) {
            finalContent = text;
        } else if (fileKey) {
            // Normalize generic 'file' type based on extension
            if (type === 'file') {
                const ext = fileKey.split('.').pop()?.toLowerCase();
                if (ext === 'pdf') type = 'pdf';
                else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) type = 'image';
                else if (['mp3', 'wav', 'm4a', 'mp4'].includes(ext || '')) type = 'audio';
                else if (['doc', 'docx'].includes(ext || '')) type = 'document';
                console.log(`Normalized generic file type to: ${type}`);
            }

            // Download file from storage
            const { data: fileData, error: downloadError } = await supabaseAdmin
                .storage
                .from('uploads')
                .download(fileKey);

            if (downloadError || !fileData) {
                throw new Error(`Failed to download file: ${downloadError?.message}`);
            }

            const fileBuffer = Buffer.from(await fileData.arrayBuffer());

            if (type === 'pdf') {
                console.log('Starting PDF extraction...');
                const extracted = await extractFromPdf(fileBuffer);
                finalContent = extracted.content;
                if (!finalTitle) finalTitle = `PDF Upload - ${new Date().toLocaleString()}`;
            } else if (type === 'image') {
                console.log('Processing Image...');
                const extracted = await extractFromImage(fileBuffer);
                finalContent = extracted.text;
                if (!finalTitle) finalTitle = `Image Upload - ${new Date().toLocaleString()}`;
            } else if (type === 'audio') {
                console.log('Processing Audio...');
                const extracted = await extractFromAudio(fileBuffer, 'mp3'); // Groq handles most formats
                finalContent = extracted.text;
                if (!finalTitle) finalTitle = `Audio Upload - ${new Date().toLocaleString()}`;
            } else if (type === 'video') {
                console.log('Processing Video...');
                // Dynamic import to avoid circular deps if any, though unlikely here
                const { extractFromVideo } = await import('@/lib/extractors/videoExtractor');
                const extracted = await extractFromVideo(fileBuffer, 'mp4');
                finalContent = extracted.text;
                if (!finalTitle) finalTitle = `Video Upload - ${new Date().toLocaleString()}`;
            } else if (type === 'document') {
                console.log('Processing Document...');
                // Determine extension from fileKey
                const parts = fileKey.split('.');
                const fileExt = parts.length > 1 ? parts.pop()?.toLowerCase() || 'docx' : 'docx';

                console.log(`Document info: Key=${fileKey}, Ext=${fileExt}, Size=${fileBuffer.length}`);
                const extracted = await extractFromDocument(fileBuffer, fileExt);
                finalContent = extracted.text;
                if (!finalTitle) finalTitle = `Document Upload - ${new Date().toLocaleString()}`;
            } else {
                // Fallback for text/md files
                const ext = fileKey.split('.').pop()?.toLowerCase();
                if (ext === 'txt' || ext === 'md') {
                    console.log(`Processing Text File (${ext})...`);
                    finalContent = fileBuffer.toString('utf-8');
                    if (!finalTitle) finalTitle = `Text Upload - ${new Date().toLocaleString()}`;
                }
            }
        }

        if (!finalContent) {
            throw new Error('No content extracted');
        }

        // 2. Update Capture with Content
        const { error: updateError } = await supabaseAdmin
            .from('captures')
            .update({
                title: finalTitle,
                raw_text: finalContent,
                ingest_status: 'processed' // We'll mark as processed here, or maybe 'chunking'? Let's say processed for the extraction phase.
            })
            .eq('id', captureId);

        if (updateError) {
            throw new Error(`Failed to update capture: ${updateError.message}`);
        }

        // 3. Chunk Content
        const chunks = await chunkText(finalContent, job.data.chunkStrategy || 'balanced');

        // 4. Insert Chunks & Queue Embeddings
        let chunkCount = 0;
        const queuePromises = [];
        const createdChunkIds: string[] = [];

        for (const [index, chunkContent] of chunks.entries()) {
            const { data: chunk, error: chunkError } = await supabaseAdmin
                .from('chunks')
                .insert({
                    capture_id: captureId,
                    seq_idx: index,
                    content: chunkContent,
                    token_count: Math.ceil(chunkContent.length / 4),
                })
                .select()
                .single();

            if (chunk) {
                createdChunkIds.push(chunk.id);
            }

            if (chunkError) {
                console.error('Chunk insert error:', chunkError);
                continue;
            }

            // Add to Queue
            queuePromises.push(
                embeddingsQueue.add('generate_embedding', {
                    chunkId: chunk.id,
                    userId,
                    captureId,
                    type,
                })
            );

            // Trigger Auto-Tagging
            queuePromises.push(
                topicerQueue.add('generate_topics', {
                    chunkId: chunk.id,
                })
            );

            chunkCount++;
        }

        // Trigger Summarization
        if (createdChunkIds.length > 0) {
            queuePromises.push(
                summarizerQueue.add('summarize_capture', {
                    chunkIds: createdChunkIds,
                    userId,
                    captureId // Passing captureId just in case we update the worker later
                })
            );
            console.log(`Triggered summarizer for ${createdChunkIds.length} chunks`);
        }


        // 5. Link to Context if provided
        if (contextId && chunks.length > 0) {
            const { data: createdChunks } = await supabaseAdmin
                .from('chunks')
                .select('id')
                .eq('capture_id', captureId);

            if (createdChunks && createdChunks.length > 0) {
                const contextChunks = createdChunks.map(chunk => ({
                    context_id: contextId,
                    chunk_id: chunk.id
                }));

                const { error: linkError } = await supabaseAdmin
                    .from('context_chunks')
                    .insert(contextChunks);

                if (linkError) {
                    console.error('Failed to link chunks to context', linkError);
                } else {
                    console.log(`Linked ${createdChunks.length} chunks to context ${contextId}`);
                }
            }
        }

        await Promise.all(queuePromises);

        // Update status to completed
        await supabaseAdmin
            .from('captures')
            .update({ ingest_status: 'completed' })
            .eq('id', captureId);

        console.log(`Ingestion complete for capture ${captureId}. Created ${chunkCount} chunks.`);

    } catch (error: any) {
        console.error(`Ingestion failed for capture ${captureId}:`, error);

        // Update status to failed
        await supabaseAdmin
            .from('captures')
            .update({
                ingest_status: 'failed',
                error_message: error.message
            })
            .eq('id', captureId);

        throw error;
    }
};

export const startIngestWorker = () => {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
    });
    const worker = new Worker('ingest-queue', processIngestJob, { connection });

    worker.on('completed', (job) => {
        console.log(`Ingest Job ${job.id} completed!`);
    });

    worker.on('failed', async (job, err) => {
        console.error(`Ingest Job ${job?.id} failed: ${err.message}`);

        Sentry.captureException(err, {
            tags: {
                worker: 'ingest',
                jobId: job?.id,
            },
            extra: {
                jobData: job?.data,
            },
        });

        if (job?.data?.captureId) {
            try {
                await supabaseAdmin
                    .from('captures')
                    .update({
                        ingest_status: 'failed',
                        // error_message: err.message, // Assuming column exists or we add it
                    })
                    .eq('id', job.data.captureId);
            } catch (dbError) {
                console.error('Failed to update capture error status:', dbError);
            }
        }
    });

    return worker;
};
