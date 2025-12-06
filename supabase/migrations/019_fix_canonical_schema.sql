-- Fix Canonical Schema
-- Drop tables in dependency order with CASCADE to handle foreign keys
DROP TABLE IF EXISTS canonical_map CASCADE;
DROP TABLE IF EXISTS canonical_chunks CASCADE;
DROP TABLE IF EXISTS concept_relations CASCADE;
DROP TABLE IF EXISTS concepts CASCADE;
DROP TABLE IF EXISTS concept_chunks CASCADE;

-- 1. Canonical Chunks (Layer 2 Dedup)
CREATE TABLE canonical_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_text TEXT NOT NULL,
    repr_vector vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE canonical_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID REFERENCES chunks(id) ON DELETE CASCADE,
    canonical_id UUID REFERENCES canonical_chunks(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chunk_id, canonical_id)
);

-- 2. Knowledge Graph
-- 2. Knowledge Graph
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    metadata JSONB,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE concept_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    relation_type TEXT,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_concept_id, target_concept_id, relation_type)
);

CREATE TABLE concept_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES chunks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(concept_id, chunk_id)
);

-- Indexes
CREATE INDEX idx_canonical_map_chunk_id ON canonical_map(chunk_id);
CREATE INDEX idx_canonical_map_canonical_id ON canonical_map(canonical_id);
CREATE INDEX idx_concept_relations_source ON concept_relations(source_concept_id);
CREATE INDEX idx_concept_relations_target ON concept_relations(target_concept_id);
CREATE INDEX idx_concept_chunks_concept_id ON concept_chunks(concept_id);
CREATE INDEX idx_concept_chunks_chunk_id ON concept_chunks(chunk_id);
