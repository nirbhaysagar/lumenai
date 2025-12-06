-- Change vector dimension to 384 for all-MiniLM-L6-v2
ALTER TABLE chunk_vectors 
ALTER COLUMN embedding TYPE vector(384);

-- Update the index (must drop and recreate)
DROP INDEX IF EXISTS idx_chunk_vectors_embedding;
CREATE INDEX idx_chunk_vectors_embedding ON chunk_vectors USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Update match_chunks function to accept 384 dim vector
create or replace function match_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_context_id uuid default null
)
returns table (
  id uuid,
  content text,
  similarity float,
  capture_id uuid,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    chunk_vectors.chunk_id as id,
    chunks.content,
    1 - (chunk_vectors.embedding <=> query_embedding) as similarity,
    chunks.capture_id,
    chunk_vectors.metadata,
    chunks.created_at
  from chunk_vectors
  join chunks on chunks.id = chunk_vectors.chunk_id
  left join context_chunks on context_chunks.chunk_id = chunks.id
  left join canonical_map on canonical_map.child_chunk_id = chunks.id
  where 1 - (chunk_vectors.embedding <=> query_embedding) > match_threshold
  and chunk_vectors.user_id = filter_user_id
  and (filter_context_id is null or context_chunks.context_id = filter_context_id)
  and canonical_map.child_chunk_id is null
  order by chunk_vectors.embedding <=> query_embedding
  limit match_count;
end;
$$;
