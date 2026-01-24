-- Add user 1695ff3e-9c73-400d-afd5-429d6640c8e7 as 'maybe' for all sessions
-- This script inserts a commitment for every session found in the 'sessions' table.
-- If a commitment already exists for this user/session combo, it updates the status to 'maybe'.

INSERT INTO session_commitments (session_id, user_id, status)
SELECT id, '1695ff3e-9c73-400d-afd5-429d6640c8e7', 'maybe'
FROM sessions
ON CONFLICT (session_id, user_id) 
DO UPDATE SET status = 'maybe';
