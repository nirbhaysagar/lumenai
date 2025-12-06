create table if not exists canonical_map (
  child_chunk_id uuid primary key references chunks(id) on delete cascade,
  canonical_chunk_id uuid references chunks(id) on delete cascade,
  created_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists canonical_map_canonical_idx on canonical_map(canonical_chunk_id);
