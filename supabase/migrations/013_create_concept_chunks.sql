-- Link Concepts to Chunks (Grounding)
CREATE TABLE IF NOT EXISTS concept_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES chunks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(concept_id, chunk_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_concept_chunks_concept_id ON concept_chunks(concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_chunks_chunk_id ON concept_chunks(chunk_id);
