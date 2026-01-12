-- Create song_votes table
CREATE TABLE song_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(song_id, user_id)
);

-- Enable RLS
ALTER TABLE song_votes ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view votes
CREATE POLICY "Everyone can view votes"
  ON song_votes FOR SELECT
  USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
  ON song_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own votes
CREATE POLICY "Users can remove their own votes"
  ON song_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime
-- NOTE: Publication "supabase_realtime" is likely set to FOR ALL TABLES.
-- If not, verify in dashboard.
-- ALTER PUBLICATION supabase_realtime ADD TABLE song_votes;
