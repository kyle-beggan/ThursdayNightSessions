INSERT INTO capabilities (name)
VALUES ('Percussion')
ON CONFLICT (name) DO NOTHING;
