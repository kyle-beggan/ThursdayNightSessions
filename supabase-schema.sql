-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'user')) DEFAULT 'user',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Capabilities table
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User capabilities junction table
CREATE TABLE user_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  UNIQUE(user_id, capability_id)
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '19:30:00',
  end_time TIME NOT NULL DEFAULT '00:00:00',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session songs table
CREATE TABLE session_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  song_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Session commitments table
CREATE TABLE session_commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Notifications table (audit log)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('session_reminder', 'broadcast')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_session_commitments_session_id ON session_commitments(session_id);
CREATE INDEX idx_session_commitments_user_id ON session_commitments(user_id);
CREATE INDEX idx_user_capabilities_user_id ON user_capabilities(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default capabilities
INSERT INTO capabilities (name) VALUES
  ('vocalist'),
  ('drums'),
  ('trumpet'),
  ('alto sax'),
  ('tenor sax'),
  ('soprano sax'),
  ('bass sax'),
  ('baritone sax'),
  ('bass guitar'),
  ('keyboards'),
  ('rhythm guitar'),
  ('lead guitar'),
  ('engineer'),
  ('videographer'),
  ('photographer');

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Capabilities table policies
CREATE POLICY "Approved users can view capabilities"
  ON capabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage capabilities"
  ON capabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- User capabilities policies
CREATE POLICY "Users can view all user capabilities"
  ON user_capabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage user capabilities"
  ON user_capabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Sessions table policies
CREATE POLICY "Approved users can view sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage sessions"
  ON sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Session songs policies
CREATE POLICY "Approved users can view session songs"
  ON session_songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage session songs"
  ON session_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Session commitments policies
CREATE POLICY "Approved users can view commitments"
  ON session_commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Users can manage their own commitments"
  ON session_commitments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Users can delete their own commitments"
  ON session_commitments FOR DELETE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can delete any commitment"
  ON session_commitments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Admins can view and create notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
