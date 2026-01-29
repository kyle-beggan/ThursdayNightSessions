-- Add is_public column to sessions
ALTER TABLE sessions 
ADD COLUMN is_public boolean DEFAULT true;

-- Create session_visibility table
CREATE TABLE session_visibility (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Index for performance
CREATE INDEX idx_session_visibility_session_id ON session_visibility(session_id);
CREATE INDEX idx_session_visibility_user_id ON session_visibility(user_id);
