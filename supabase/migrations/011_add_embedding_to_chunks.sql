
-- Enable vector extension if not already enabled
create extension if not exists vector;

-- Add embedding column to chunks table
alter table chunks add column if not exists embedding vector(1536);

-- Create index for faster vector search
create index if not exists idx_chunks_embedding on chunks using hnsw (embedding vector_cosine_ops);
