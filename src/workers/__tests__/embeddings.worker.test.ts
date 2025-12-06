import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processEmbeddingsJob } from '../embeddings.worker';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
    supabaseAdmin: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
    },
}));

vi.mock('../../lib/embeddings', () => ({
    generateEmbeddings: vi.fn(),
}));

vi.mock('../../lib/sentryHelpers', () => ({
    addBreadcrumb: vi.fn(),
}));

vi.mock('@sentry/node', () => ({
    captureException: vi.fn(),
    flush: vi.fn(),
}));

// Import mocks to configure them
import { supabaseAdmin } from '../../lib/supabase';
import { generateEmbeddings } from '../../lib/embeddings';

describe('Embeddings Worker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should process a valid job successfully', async () => {
        // Setup mocks
        const mockChunk = { id: 'chunk-1', content: 'test content' };
        const mockEmbedding = [0.1, 0.2, 0.3];

        const createMockBuilder = (overrides = {}) => {
            const builder: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockChunk, error: null }),
                insert: vi.fn().mockResolvedValue({ error: null }),
                update: vi.fn().mockReturnThis(),
                ...overrides
            };
            // Make it thenable for await to support awaiting the builder directly
            builder.then = (resolve: any) => resolve({ error: null });
            return builder;
        };

        (supabaseAdmin.from as any).mockImplementation((table: string) => {
            if (table === 'chunks') {
                return createMockBuilder({
                    single: vi.fn().mockResolvedValue({ data: mockChunk, error: null })
                });
            }
            return createMockBuilder();
        });

        (generateEmbeddings as any).mockResolvedValue(mockEmbedding);

        const job = {
            id: 'job-1',
            data: {
                chunkId: 'chunk-1',
                userId: 'user-1',
                captureId: 'capture-1',
                type: 'text',
            },
        };

        await processEmbeddingsJob(job);

        // Verify interactions
        expect(supabaseAdmin.from).toHaveBeenCalledWith('chunks');
        expect(generateEmbeddings).toHaveBeenCalledWith('test content');
        expect(supabaseAdmin.from).toHaveBeenCalledWith('chunk_vectors');
        expect(supabaseAdmin.from).toHaveBeenCalledWith('captures');
    });

    it('should handle errors when chunk is not found', async () => {
        // Setup mocks to return error
        (supabaseAdmin.from as any).mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }));

        const job = {
            id: 'job-1',
            data: {
                chunkId: 'chunk-1',
                userId: 'user-1',
                captureId: 'capture-1',
                type: 'text',
            },
        };

        await expect(processEmbeddingsJob(job)).rejects.toThrow('Chunk not found: Not found');
    });
});
