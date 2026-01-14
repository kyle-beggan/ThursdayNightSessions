INSERT INTO capabilities (name)
VALUES ('Acoustic Guitar')
ON CONFLICT (name) DO NOTHING;
