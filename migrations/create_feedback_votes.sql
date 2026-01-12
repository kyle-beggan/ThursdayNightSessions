-- Create feedback_votes table
CREATE TABLE feedback_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feedback_id)
);

-- Enable RLS
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can manage their own votes
CREATE POLICY "Users can vote"
  ON feedback_votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Everyone can view votes (to count them)
CREATE POLICY "Everyone can view votes"
  ON feedback_votes FOR SELECT
  USING (true);
