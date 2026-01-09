-- STEP 1: Drop all existing tables (run this first to clean up)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS session_commitments CASCADE;
DROP TABLE IF EXISTS session_songs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_capabilities CASCADE;
DROP TABLE IF EXISTS capabilities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- STEP 2: Now run the schema creation
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (standalone, no auth.users dependency)
CREATE TABLE users (
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

-- Notifications table
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

-- Create indexes
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

-- STEP 3: Insert test data
-- Insert a test user
INSERT INTO users (id, email, name, phone, user_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@sleepyhollows.com',
  'Test User',
  '+15551234567',
  'admin',
  'approved'
);

-- Insert test sessions for January 2026
INSERT INTO sessions (date, start_time, end_time, created_by) VALUES
  ('2026-01-09', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001'),
  ('2026-01-16', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001'),
  ('2026-01-23', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001'),
  ('2026-01-30', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001');

-- Add songs to the sessions
INSERT INTO session_songs (session_id, song_name, song_url, "order")
SELECT id, 'Superstition', 'https://www.youtube.com/watch?v=0CFuCYNx-1g', 0
FROM sessions WHERE date = '2026-01-09'
UNION ALL
SELECT id, 'September', 'https://www.youtube.com/watch?v=Gs069dndIYk', 1
FROM sessions WHERE date = '2026-01-09'
UNION ALL
SELECT id, 'Brick House', 'https://www.youtube.com/watch?v=rrBx6mAWYPU', 0
FROM sessions WHERE date = '2026-01-16'
UNION ALL
SELECT id, 'Pick Up The Pieces', 'https://www.youtube.com/watch?v=FnH_zwVmiuE', 0
FROM sessions WHERE date = '2026-01-23'
UNION ALL
SELECT id, 'What Is Hip', 'https://www.youtube.com/watch?v=oAatPPEaZDA', 1
FROM sessions WHERE date = '2026-01-23';
