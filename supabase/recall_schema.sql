-- 1. Concepts (Layer 3: Abstract Knowledge)
create table if not exists concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  category text, -- 'person', 'project', 'technology', 'goal', etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

-- 2. Concept Relations (Knowledge Graph Edges)
create table if not exists concept_relations (
  id uuid primary key default gen_random_uuid(),
  source_concept_id uuid references concepts(id) on delete cascade,
  target_concept_id uuid references concepts(id) on delete cascade,
  relation_type text not null, -- 'is_a', 'related_to', 'part_of', 'author_of', etc.
  strength float default 1.0,
  created_at timestamptz default now(),
  unique(source_concept_id, target_concept_id, relation_type)
);

-- 3. Concept <-> Chunk Mapping (Grounding)
create table if not exists concept_chunks (
  concept_id uuid references concepts(id) on delete cascade,
  chunk_id uuid references chunks(id) on delete cascade,
  primary key (concept_id, chunk_id)
);

-- 4. Recall Items (Active Recall Requests)
create table if not exists recall_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  content text not null, -- "Remember to buy milk"
  context_id uuid references contexts(id) on delete set null,
  source_chunk_id uuid references chunks(id) on delete set null,
  
  -- Recall Metadata
  recall_type text default 'explicit', -- 'explicit', 'implicit', 'predictive'
  status text default 'active', -- 'active', 'dismissed', 'completed'
  
  -- Scheduling
  created_at timestamptz default now(),
  due_at timestamptz,
  last_recalled_at timestamptz
);

-- 5. Memory Strength (Spaced Repetition Data)
create table if not exists memory_strength (
  recall_item_id uuid primary key references recall_items(id) on delete cascade,
  strength float default 0.0, -- 0.0 to 1.0 (retention probability)
  interval_days float default 1.0, -- Next interval in days
  ease_factor float default 2.5, -- Multiplier for interval
  review_count int default 0,
  last_review_at timestamptz default now(),
  next_review_at timestamptz default now() + interval '1 day'
);

-- Indexes
create index if not exists idx_concepts_user_name on concepts(user_id, name);
create index if not exists idx_recall_items_user_status on recall_items(user_id, status);
create index if not exists idx_memory_strength_next_review on memory_strength(next_review_at);
