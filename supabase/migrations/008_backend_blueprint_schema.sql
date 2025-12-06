-- 1. Canonical Chunks (Layer 2 Dedup)
CREATE TABLE IF NOT EXISTS canonical_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_text TEXT NOT NULL,
    repr_vector vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canonical_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID REFERENCES chunks(id) ON DELETE CASCADE,
    canonical_id UUID REFERENCES canonical_chunks(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chunk_id, canonical_id)
);

-- 2. Knowledge Graph
CREATE TABLE IF NOT EXISTS concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS concept_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    to_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    relation_type TEXT,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Usage Logs
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint TEXT,
    cost_estimate FLOAT,
    tokens INT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Summaries (Ensure it exists)
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
    capture_id UUID REFERENCES captures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT, -- 'executive', 'brief', etc.
    content TEXT,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_canonical_map_chunk_id ON canonical_map(chunk_id);
CREATE INDEX IF NOT EXISTS idx_canonical_map_canonical_id ON canonical_map(canonical_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_from ON concept_relations(from_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_to ON concept_relations(to_concept_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_context_id ON summaries(context_id);
