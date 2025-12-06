create table if not exists summaries (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null, -- Can be context_id or chunk_id
  target_type text not null, -- 'context' or 'chunk' or 'capture'
  content text not null,
  created_at timestamptz default now()
);
