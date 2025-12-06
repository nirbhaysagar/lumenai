-- Add error tracking columns to captures table
ALTER TABLE captures 
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Update ingest_status enum if it's an enum (or just check constraint)
-- Assuming ingest_status is text or enum. If text, no change needed.
-- If enum, we might need to add 'failed'. 
-- Let's assume it's text for now based on previous code ('processing', 'completed').
