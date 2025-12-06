create table if not exists integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null, -- 'google', 'slack', etc.
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- RLS
alter table integrations enable row level security;

create policy "Users can view their own integrations"
  on integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on integrations for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger handle_updated_at before update on integrations
  for each row execute procedure moddatetime (updated_at);
