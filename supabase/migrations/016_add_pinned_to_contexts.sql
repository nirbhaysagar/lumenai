-- Add pinned column to contexts table
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_contexts_pinned ON contexts(pinned);
