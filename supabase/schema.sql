-- Enable pgvector (run as superuser / in Supabase SQL editor)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. users table (minimal)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

-- 2. captures (raw inputs)
create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null, -- 'text','url','pdf','image','tweet','video','code',etc
  title text,
  source_url text,
  raw_text text,
  file_key text,
  mime_type text,
  provenance jsonb, -- any extra metadata
  visible_in_rag boolean default true,
  ingest_status text default 'pending',
  created_at timestamptz default now()
);

-- 3. chunks (processed pieces)
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid references captures(id) on delete cascade,
  seq_idx int default 0,
  content text not null,
  summary text,
  token_count int default 0,
  layer text default 'raw', -- 'raw', 'canonical', 'abstract'
  metadata jsonb,
  created_at timestamptz default now()
);

-- 4. vector storage table
-- store vectors in a dedicated table (preferred for indexing)
create table if not exists chunk_vectors (
  chunk_id uuid primary key references chunks(id) on delete cascade,
  embedding vector(1536), -- adjust dim to your embedding model
  user_id uuid,
  created_at timestamptz default now(),
  metadata jsonb
);

-- create index for fast ANN queries (ivfflat)
-- If using pgvector, you can create ivfflat index for larger datasets
-- Note: adjust 'lists' according to dataset size; 100 is reasonable start
create index if not exists idx_chunk_vectors_embedding on chunk_vectors using ivfflat (embedding) with (lists = 100);

-- 5. contexts (project-like scopes)
create table if not exists contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text,
  description text,
  rule_json jsonb,
  created_at timestamptz default now()
);

-- 6. context_chunks (mapping)
create table if not exists context_chunks (
  context_id uuid references contexts(id) on delete cascade,
  chunk_id uuid references chunks(id) on delete cascade,
  primary key (context_id, chunk_id)
);
