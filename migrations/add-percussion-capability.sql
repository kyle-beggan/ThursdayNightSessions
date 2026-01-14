INSERT INTO capabilities (name, category, icon)
VALUES ('Percussion', 'Percussion', '🥁')
ON CONFLICT (name) DO NOTHING;
