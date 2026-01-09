-- Simplified schema for development (without Supabase Auth integration)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (standalone, no auth.users dependency)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'user')) DEFAULT 'user',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Capabilities table
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User capabilities junction table
CREATE TABLE IF NOT EXISTS user_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  UNIQUE(user_id, capability_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '19:30:00',
  end_time TIME NOT NULL DEFAULT '00:00:00',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session songs table
CREATE TABLE IF NOT EXISTS session_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  song_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Session commitments table
CREATE TABLE IF NOT EXISTS session_commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Notifications table (audit log)
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_session_commitments_session_id ON session_commitments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_commitments_user_id ON session_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_capabilities_user_id ON user_capabilities(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
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
  ('photographer')
ON CONFLICT (name) DO NOTHING;
