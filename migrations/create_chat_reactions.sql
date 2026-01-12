-- Create chat_reactions table
CREATE TABLE chat_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view reactions
CREATE POLICY "Everyone can view reactions"
  ON chat_reactions FOR SELECT
  USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON chat_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON chat_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;
