-- Seed script for users and capabilities
-- This creates a realistic band with multiple members and their instruments

-- Add 15 band members with various capabilities
INSERT INTO users (id, email, name, phone, user_type, status) VALUES
  -- Vocalists
  ('10000000-0000-0000-0000-000000000001', 'alex.rivera@sleepyhollows.com', 'Alex Rivera', '+15551234501', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000002', 'jordan.lee@sleepyhollows.com', 'Jordan Lee', '+15551234502', 'user', 'approved'),
  
  -- Rhythm Section
  ('10000000-0000-0000-0000-000000000003', 'marcus.drums@sleepyhollows.com', 'Marcus Thompson', '+15551234503', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000004', 'rachel.bass@sleepyhollows.com', 'Rachel Martinez', '+15551234504', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000005', 'chris.keys@sleepyhollows.com', 'Chris Anderson', '+15551234505', 'user', 'approved'),
  
  -- Guitars
  ('10000000-0000-0000-0000-000000000006', 'david.guitar@sleepyhollows.com', 'David Chen', '+15551234506', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000007', 'emily.guitar@sleepyhollows.com', 'Emily Wilson', '+15551234507', 'user', 'approved'),
  
  -- Horn Section
  ('10000000-0000-0000-0000-000000000008', 'tony.trumpet@sleepyhollows.com', 'Tony Parker', '+15551234508', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000009', 'lisa.sax@sleepyhollows.com', 'Lisa Jackson', '+15551234509', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000010', 'james.sax@sleepyhollows.com', 'James Brown', '+15551234510', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000011', 'sarah.sax@sleepyhollows.com', 'Sarah Davis', '+15551234511', 'user', 'approved'),
  
  -- Multi-instrumentalists
  ('10000000-0000-0000-0000-000000000012', 'mike.multi@sleepyhollows.com', 'Mike Rodriguez', '+15551234512', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000013', 'nina.multi@sleepyhollows.com', 'Nina Taylor', '+15551234513', 'user', 'approved'),
  
  -- Tech crew
  ('10000000-0000-0000-0000-000000000014', 'sam.engineer@sleepyhollows.com', 'Sam Williams', '+15551234514', 'user', 'approved'),
  ('10000000-0000-0000-0000-000000000015', 'casey.video@sleepyhollows.com', 'Casey Moore', '+15551234515', 'user', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Assign capabilities to users
-- Alex Rivera: Lead vocalist
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM capabilities WHERE name = 'vocalist';

-- Jordan Lee: Vocalist, rhythm guitar
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000002', id FROM capabilities WHERE name IN ('vocalist', 'rhythm guitar');

-- Marcus Thompson: Drums
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000003', id FROM capabilities WHERE name = 'drums';

-- Rachel Martinez: Bass guitar
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000004', id FROM capabilities WHERE name = 'bass guitar';

-- Chris Anderson: Keyboards
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000005', id FROM capabilities WHERE name = 'keyboards';

-- David Chen: Lead guitar
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000006', id FROM capabilities WHERE name = 'lead guitar';

-- Emily Wilson: Rhythm guitar, vocalist
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000007', id FROM capabilities WHERE name IN ('rhythm guitar', 'vocalist');

-- Tony Parker: Trumpet
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000008', id FROM capabilities WHERE name = 'trumpet';

-- Lisa Jackson: Alto sax
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000009', id FROM capabilities WHERE name = 'alto sax';

-- James Brown: Tenor sax
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000010', id FROM capabilities WHERE name = 'tenor sax';

-- Sarah Davis: Baritone sax
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000011', id FROM capabilities WHERE name = 'baritone sax';

-- Mike Rodriguez: Keyboards, bass guitar, vocalist
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000012', id FROM capabilities WHERE name IN ('keyboards', 'bass guitar', 'vocalist');

-- Nina Taylor: Trumpet, alto sax, vocalist
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000013', id FROM capabilities WHERE name IN ('trumpet', 'alto sax', 'vocalist');

-- Sam Williams: Engineer
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000014', id FROM capabilities WHERE name = 'engineer';

-- Casey Moore: Videographer, photographer
INSERT INTO user_capabilities (user_id, capability_id)
SELECT '10000000-0000-0000-0000-000000000015', id FROM capabilities WHERE name IN ('videographer', 'photographer');

-- Add commitments to sessions with realistic attendance patterns
-- Session 1 (Jan 9): Full band - 10 people
INSERT INTO session_commitments (session_id, user_id)
SELECT s.id, u.id 
FROM sessions s
CROSS JOIN users u
WHERE s.date = '2026-01-09'
  AND u.id IN (
    '10000000-0000-0000-0000-000000000001', -- Alex (vocalist)
    '10000000-0000-0000-0000-000000000003', -- Marcus (drums)
    '10000000-0000-0000-0000-000000000004', -- Rachel (bass)
    '10000000-0000-0000-0000-000000000005', -- Chris (keys)
    '10000000-0000-0000-0000-000000000006', -- David (lead guitar)
    '10000000-0000-0000-0000-000000000008', -- Tony (trumpet)
    '10000000-0000-0000-0000-000000000009', -- Lisa (alto sax)
    '10000000-0000-0000-0000-000000000010', -- James (tenor sax)
    '10000000-0000-0000-0000-000000000011', -- Sarah (bari sax)
    '10000000-0000-0000-0000-000000000014'  -- Sam (engineer)
  )
ON CONFLICT DO NOTHING;

-- Session 2 (Jan 16): Smaller group - 7 people
INSERT INTO session_commitments (session_id, user_id)
SELECT s.id, u.id 
FROM sessions s
CROSS JOIN users u
WHERE s.date = '2026-01-16'
  AND u.id IN (
    '10000000-0000-0000-0000-000000000002', -- Jordan (vocalist/guitar)
    '10000000-0000-0000-0000-000000000003', -- Marcus (drums)
    '10000000-0000-0000-0000-000000000012', -- Mike (keys/bass/vocal)
    '10000000-0000-0000-0000-000000000007', -- Emily (rhythm guitar)
    '10000000-0000-0000-0000-000000000008', -- Tony (trumpet)
    '10000000-0000-0000-0000-000000000013', -- Nina (trumpet/sax/vocal)
    '10000000-0000-0000-0000-000000000015'  -- Casey (video)
  )
ON CONFLICT DO NOTHING;

-- Session 3 (Jan 23): Big session - 12 people
INSERT INTO session_commitments (session_id, user_id)
SELECT s.id, u.id 
FROM sessions s
CROSS JOIN users u
WHERE s.date = '2026-01-23'
  AND u.id IN (
    '10000000-0000-0000-0000-000000000001', -- Alex (vocalist)
    '10000000-0000-0000-0000-000000000002', -- Jordan (vocalist/guitar)
    '10000000-0000-0000-0000-000000000003', -- Marcus (drums)
    '10000000-0000-0000-0000-000000000004', -- Rachel (bass)
    '10000000-0000-0000-0000-000000000005', -- Chris (keys)
    '10000000-0000-0000-0000-000000000006', -- David (lead guitar)
    '10000000-0000-0000-0000-000000000007', -- Emily (rhythm guitar)
    '10000000-0000-0000-0000-000000000008', -- Tony (trumpet)
    '10000000-0000-0000-0000-000000000009', -- Lisa (alto sax)
    '10000000-0000-0000-0000-000000000010', -- James (tenor sax)
    '10000000-0000-0000-0000-000000000014', -- Sam (engineer)
    '10000000-0000-0000-0000-000000000015'  -- Casey (video)
  )
ON CONFLICT DO NOTHING;

-- Session 4 (Jan 30): Medium group - 8 people
INSERT INTO session_commitments (session_id, user_id)
SELECT s.id, u.id 
FROM sessions s
CROSS JOIN users u
WHERE s.date = '2026-01-30'
  AND u.id IN (
    '10000000-0000-0000-0000-000000000001', -- Alex (vocalist)
    '10000000-0000-0000-0000-000000000003', -- Marcus (drums)
    '10000000-0000-0000-0000-000000000004', -- Rachel (bass)
    '10000000-0000-0000-0000-000000000005', -- Chris (keys)
    '10000000-0000-0000-0000-000000000006', -- David (lead guitar)
    '10000000-0000-0000-0000-000000000009', -- Lisa (alto sax)
    '10000000-0000-0000-0000-000000000011', -- Sarah (bari sax)
    '10000000-0000-0000-0000-000000000014'  -- Sam (engineer)
  )
ON CONFLICT DO NOTHING;
