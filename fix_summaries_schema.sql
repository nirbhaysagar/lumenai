-- Run this in your Supabase SQL Editor to fix the "Context Not Found" error

-- 1. Add the missing context_id column to the summaries table
ALTER TABLE "public"."summaries" 
ADD COLUMN IF NOT EXISTS "context_id" uuid REFERENCES "public"."contexts"("id") ON DELETE CASCADE;

-- 2. Create an index for faster lookups
CREATE INDEX IF NOT EXISTS "summaries_context_id_idx" ON "public"."summaries" ("context_id");

-- 3. Verify the change (optional)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'summaries';
