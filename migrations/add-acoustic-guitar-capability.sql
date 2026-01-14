INSERT INTO capabilities (name, category, icon)
VALUES ('Acoustic Guitar', 'Strings', '🎸')
ON CONFLICT (name) DO NOTHING;
