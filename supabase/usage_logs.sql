create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- Can be null for system tasks
  type text not null, -- 'embedding', 'chat', 'summary'
  model text not null,
  tokens_input int default 0,
  tokens_output int default 0,
  cost float default 0,
  created_at timestamptz default now()
);

create index if not exists usage_logs_created_at_idx on usage_logs(created_at);
