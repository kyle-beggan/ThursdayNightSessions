-- Add test data for commitments and capabilities

-- First, let's add some more test users with capabilities
INSERT INTO users (id, email, name, phone, user_type, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john@sleepyhollows.com', 'John Smith', '+15551234568', 'user', 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'sarah@sleepyhollows.com', 'Sarah Johnson', '+15551234569', 'user', 'approved'),
  ('33333333-3333-3333-3333-333333333333', 'mike@sleepyhollows.com', 'Mike Davis', '+15551234570', 'user', 'approved'),
  ('44444444-4444-4444-4444-444444444444', 'lisa@sleepyhollows.com', 'Lisa Brown', '+15551234571', 'user', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Assign capabilities to users
-- John: vocalist, rhythm guitar
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM capabilities WHERE name IN ('vocalist', 'rhythm guitar')
ON CONFLICT DO NOTHING;

-- Sarah: drums
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM capabilities WHERE name = 'drums'
ON CONFLICT DO NOTHING;

-- Mike: bass guitar, keyboards
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM capabilities WHERE name IN ('bass guitar', 'keyboards')
ON CONFLICT DO NOTHING;

-- Lisa: trumpet, alto sax
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM capabilities WHERE name IN ('trumpet', 'alto sax')
ON CONFLICT DO NOTHING;

-- Add commitments to the January sessions
-- Session 1 (Jan 9): John, Sarah, Mike
INSERT INTO session_commitments (session_id, user_id)
SELECT id, '11111111-1111-1111-1111-111111111111' FROM sessions WHERE date = '2026-01-09'
UNION ALL
SELECT id, '22222222-2222-2222-2222-222222222222' FROM sessions WHERE date = '2026-01-09'
UNION ALL
SELECT id, '33333333-3333-3333-3333-333333333333' FROM sessions WHERE date = '2026-01-09'
ON CONFLICT DO NOTHING;

-- Session 2 (Jan 16): Sarah, Mike, Lisa
INSERT INTO session_commitments (session_id, user_id)
SELECT id, '22222222-2222-2222-2222-222222222222' FROM sessions WHERE date = '2026-01-16'
UNION ALL
SELECT id, '33333333-3333-3333-3333-333333333333' FROM sessions WHERE date = '2026-01-16'
UNION ALL
SELECT id, '44444444-4444-4444-4444-444444444444' FROM sessions WHERE date = '2026-01-16'
ON CONFLICT DO NOTHING;

-- Session 3 (Jan 23): All four users
INSERT INTO session_commitments (session_id, user_id)
SELECT id, '11111111-1111-1111-1111-111111111111' FROM sessions WHERE date = '2026-01-23'
UNION ALL
SELECT id, '22222222-2222-2222-2222-222222222222' FROM sessions WHERE date = '2026-01-23'
UNION ALL
SELECT id, '33333333-3333-3333-3333-333333333333' FROM sessions WHERE date = '2026-01-23'
UNION ALL
SELECT id, '44444444-4444-4444-4444-444444444444' FROM sessions WHERE date = '2026-01-23'
ON CONFLICT DO NOTHING;

-- Session 4 (Jan 30): John, Lisa
INSERT INTO session_commitments (session_id, user_id)
SELECT id, '11111111-1111-1111-1111-111111111111' FROM sessions WHERE date = '2026-01-30'
UNION ALL
SELECT id, '44444444-4444-4444-4444-444444444444' FROM sessions WHERE date = '2026-01-30'
ON CONFLICT DO NOTHING;
