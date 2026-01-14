-- Add Upright Bass capability
INSERT INTO capabilities (name, icon)
VALUES ('Upright Bass', '🎻')
ON CONFLICT (name) DO NOTHING;
