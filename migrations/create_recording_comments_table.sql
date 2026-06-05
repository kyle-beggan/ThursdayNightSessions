-- Create recording_comments table
CREATE TABLE IF NOT EXISTS recording_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES session_recordings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recording_comments ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view recording comments
DROP POLICY IF EXISTS "Everyone can view recording comments" ON recording_comments;
CREATE POLICY "Everyone can view recording comments"
  ON recording_comments FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
DROP POLICY IF EXISTS "Users can post recording comments" ON recording_comments;
CREATE POLICY "Users can post recording comments"
  ON recording_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete own recording comments" ON recording_comments;
CREATE POLICY "Users can delete own recording comments"
  ON recording_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any comment
DROP POLICY IF EXISTS "Admins can delete any recording comment" ON recording_comments;
CREATE POLICY "Admins can delete any recording comment"
  ON recording_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_recording_comments_recording_id ON recording_comments(recording_id);
