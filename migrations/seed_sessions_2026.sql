-- Query to insert sessions for every Thursday in 2026, starting Jan 29
-- Start Time: 8:00 PM (20:00:00)
-- End Time: Midnight (00:00:00)

INSERT INTO sessions (date, start_time, end_time, created_by)
SELECT 
    d::date as date,
    '20:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) as created_by
FROM generate_series(
    '2026-01-29'::date, 
    '2026-12-31'::date, 
    '1 week'::interval
) as d;

-- Verification
-- SELECT * FROM sessions WHERE date >= '2026-01-01' ORDER BY date;
