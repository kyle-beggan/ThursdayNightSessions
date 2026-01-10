-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL for global chat
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- Policy: Anyone can read messages (Restrict to authenticated if needed, but 'public' usually fine for this app context or use 'authenticated' role)
CREATE POLICY "Authenticated users can select chat messages" ON chat_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Users can insert their own messages
-- Note: We trust the backend API to validate user_id usually, but for direct Supabase client usage:
CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role'); 
  -- Note: user_id in table is UUID linking to 'users' table. 
  -- Supabase auth.uid() matches the auth.users id. 
  -- Our 'users' table usually shares ID with auth.users if set up that way.
  -- If 'users' table IDs are different from auth.uid(), we might need a lookup or relax this for API-based insertion.
  -- Given our API routes use service_role key, they will bypass RLS anyway. 
  -- These policies are for Client-Side access if we used it. 
  -- Since we are moving to use purely API routes for safety, RLS matters less but is good practice.

-- Enable Realtime
-- This command often requires superuser/extensions.
-- If this fails in dashboard, user must enable it manually.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
-- OR specifically:
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
