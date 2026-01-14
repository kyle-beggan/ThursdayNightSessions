INSERT INTO capabilities (name)
VALUES ('Ukulele')
ON CONFLICT (name) DO NOTHING;
