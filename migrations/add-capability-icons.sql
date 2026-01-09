-- Add icon column to capabilities table
ALTER TABLE capabilities 
ADD COLUMN icon TEXT DEFAULT '🎸';

-- Update existing capabilities with appropriate icons
UPDATE capabilities SET icon = '🎤' WHERE name = 'vocalist';
UPDATE capabilities SET icon = '🥁' WHERE name = 'drums';
UPDATE capabilities SET icon = '🎺' WHERE name = 'trumpet';
UPDATE capabilities SET icon = '🎷' WHERE name LIKE '%sax%';
UPDATE capabilities SET icon = '🎸' WHERE name LIKE '%guitar%';
UPDATE capabilities SET icon = '🎹' WHERE name = 'keyboards';
UPDATE capabilities SET icon = '🎛️' WHERE name = 'engineer';
UPDATE capabilities SET icon = '📹' WHERE name = 'videographer';
UPDATE capabilities SET icon = '📷' WHERE name = 'photographer';
