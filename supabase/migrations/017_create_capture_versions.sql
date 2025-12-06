-- Create capture_versions table
CREATE TABLE IF NOT EXISTS capture_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capture_id UUID REFERENCES captures(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index for faster retrieval
CREATE INDEX IF NOT EXISTS idx_capture_versions_capture_id ON capture_versions(capture_id);
