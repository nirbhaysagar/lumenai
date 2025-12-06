ALTER TABLE captures 
ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_captures_context_id ON captures(context_id);
