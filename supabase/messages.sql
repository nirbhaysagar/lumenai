
-- Create messages table for chat history
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  context_id uuid references contexts(id) on delete cascade, -- Nullable for general chat
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb, -- For citations, tokens, etc.
  created_at timestamptz default now()
);

-- Index for fast retrieval by context
create index if not exists idx_messages_context_id on messages(context_id);
create index if not exists idx_messages_user_id on messages(user_id);
