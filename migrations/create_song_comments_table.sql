-- Create song_comments table
CREATE TABLE song_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view song comments
CREATE POLICY "Everyone can view song comments"
  ON song_comments FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can post song comments"
  ON song_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own song comments"
  ON song_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any song comment"
  ON song_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Index for performance
CREATE INDEX idx_song_comments_song_id ON song_comments(song_id);
