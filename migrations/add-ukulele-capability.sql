INSERT INTO capabilities (name, category, icon)
VALUES ('Ukulele', 'Strings', '🎸')
ON CONFLICT (name) DO NOTHING;
