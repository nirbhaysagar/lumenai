-- Add pinned column to captures table
ALTER TABLE captures ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- Index for faster filtering by pinned status
CREATE INDEX IF NOT EXISTS idx_captures_pinned ON captures(pinned);
