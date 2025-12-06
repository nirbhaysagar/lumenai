-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

-- 2. captures
create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  title text,
  source_url text,
  raw_text text,
  file_key text,
  mime_type text,
  provenance jsonb,
  visible_in_rag boolean default true,
  ingest_status text default 'pending',
  created_at timestamptz default now()
);

-- 3. chunks
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid references captures(id) on delete cascade,
  seq_idx int default 0,
  content text not null,
  summary text,
  token_count int default 0,
  metadata jsonb,
  created_at timestamptz default now()
);

-- 4. chunk_vectors
create table if not exists chunk_vectors (
  chunk_id uuid primary key references chunks(id) on delete cascade,
  embedding vector(1536),
  user_id uuid,
  created_at timestamptz default now(),
  metadata jsonb
);
create index if not exists idx_chunk_vectors_embedding on chunk_vectors using ivfflat (embedding) with (lists = 100);

-- 5. contexts
create table if not exists contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text,
  description text,
  rule_json jsonb,
  created_at timestamptz default now()
);

-- 6. context_chunks
create table if not exists context_chunks (
  context_id uuid references contexts(id) on delete cascade,
  chunk_id uuid references chunks(id) on delete cascade,
  primary key (context_id, chunk_id)
);

-- 7. canonical_map
create table if not exists canonical_map (
  child_chunk_id uuid primary key references chunks(id) on delete cascade,
  canonical_chunk_id uuid references chunks(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists canonical_map_canonical_idx on canonical_map(canonical_chunk_id);

-- 8. summaries
create table if not exists summaries (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null,
  target_type text not null,
  content text not null,
  created_at timestamptz default now()
);

-- 9. usage_logs
create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,
  model text not null,
  tokens_input int default 0,
  tokens_output int default 0,
  cost float default 0,
  created_at timestamptz default now()
);
create index if not exists usage_logs_created_at_idx on usage_logs(created_at);

-- 10. match_chunks function
create or replace function match_chunks (
  query_embedding vector(1536),
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
