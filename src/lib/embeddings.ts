import { logUsage } from './logger';

// Singleton to hold the model pipeline
let embedder: any = null;

export async function generateEmbeddings(text: string): Promise<number[]> {
    try {
        // Initialize pipeline if not already done
        if (!embedder) {
            console.log('🔌 Initializing local embedding model (Xenova/all-MiniLM-L6-v2)...');
            // Dynamic import to prevent top-level await/hang issues
            const { pipeline } = await import('@xenova/transformers');
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        // Generate embedding
        const output = await embedder(text, { pooling: 'mean', normalize: true });

        // Convert Tensor to standard array
        const embedding = Array.from(output.data) as number[];

        // Log usage (mock tokens for local)
        const mockTokens = Math.ceil(text.length / 4);
        logUsage(null, 'embedding', 'local-all-MiniLM-L6-v2', mockTokens, 0);

        return embedding;
    } catch (error) {
        console.error('Error generating local embeddings:', error);
        throw error;
    }
}
