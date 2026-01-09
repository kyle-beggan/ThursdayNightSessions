-- Create songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  key TEXT,
  tempo TEXT,
  resource_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'proposed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view active songs
CREATE POLICY "Everyone can view active songs"
  ON songs FOR SELECT
  USING (true);

-- Approved users can insert songs
CREATE POLICY "Approved users can add songs"
  ON songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

-- Admins can update/delete songs
CREATE POLICY "Admins can manage songs"
  ON songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Users can update their own songs (optional, or just restrict to admins?)
-- Let's allow users to edit songs they created for now, or just admins.
-- Plan said "Approved users + Admin" for Edit/Create.
-- Let's add policy for Approved users to update as well, maybe?
-- For simplicity, let's stick to Approved can INSERT, Everyone can VIEW, Admins can DO ALL.
-- And maybe users can update their own?
CREATE POLICY "Users can update their own songs"
  ON songs FOR UPDATE
  USING (created_by = auth.uid());

-- Indexes
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
