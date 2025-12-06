-- Create memory_directives table for Memory Intent Layer
CREATE TABLE IF NOT EXISTS memory_directives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('chunk', 'capture', 'summary')),
  target_id UUID NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'topic', 'manual')),
  trigger_value TEXT, -- ISO date for time, topic string for topic
  action TEXT DEFAULT 'surface' CHECK (action IN ('surface', 'notify', 'email')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_memory_directives_user ON memory_directives(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_directives_trigger ON memory_directives(trigger_type, trigger_value);
CREATE INDEX IF NOT EXISTS idx_memory_directives_target ON memory_directives(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_memory_directives_active ON memory_directives(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE memory_directives ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own directives
CREATE POLICY "Users can view their own directives"
  ON memory_directives FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy to allow users to insert their own directives
CREATE POLICY "Users can insert their own directives"
  ON memory_directives FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy to allow users to update their own directives
CREATE POLICY "Users can update their own directives"
  ON memory_directives FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy to allow users to delete their own directives
CREATE POLICY "Users can delete their own directives"
  ON memory_directives FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
