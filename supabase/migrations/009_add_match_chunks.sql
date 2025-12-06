-- Drop the old 6-argument version (with context_id)
drop function if exists match_chunks(vector, float, int, uuid, uuid, uuid);

-- Drop the new 5-argument version (without context_id) just in case it exists
drop function if exists match_chunks(vector, float, int, uuid, uuid);

-- Function to match chunks using vector similarity
-- Function to match chunks using vector similarity
create or replace function match_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_capture_id uuid default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float,
  created_at timestamptz,
  capture_id uuid
)
language plpgsql
as $$
begin
  return query
  select
    chunks.id,
    chunks.content,
    chunks.metadata,
    1 - (chunk_vectors.embedding <=> query_embedding) as similarity,
    chunks.created_at,
    chunks.capture_id
  from chunks
  join captures on chunks.capture_id = captures.id
  join chunk_vectors on chunks.id = chunk_vectors.chunk_id
  where 1 - (chunk_vectors.embedding <=> query_embedding) > match_threshold
  and captures.user_id = filter_user_id
  and (filter_capture_id is null or chunks.capture_id = filter_capture_id)
  order by chunk_vectors.embedding <=> query_embedding
  limit match_count;
end;
$$;
