-- Clear existing data (Order matters for foreign keys)
DELETE FROM user_capabilities;
DELETE FROM capabilities;

-- Insert Standard Instruments (from lib/icons.ts)
INSERT INTO capabilities (name, icon) VALUES
('Guitar', 'GiGuitar'),
('Keyboard', 'GiPianoKeys'),
('Drums', 'GiDrumKit'),
('Vocals', 'GiMicrophone'),
('Saxophone', 'GiSaxophone'),
('Trumpet', 'GiTrumpet'),
('Violin', 'GiViolin'),
('Banjo', 'GiBanjo'),
('Conga/Djembe', 'GiDjembe'),
('Accordion', 'GiAccordion'),
('Maracas', 'GiMaracas'),
('Flute', 'GiFlute');

-- Insert Special SVG Instruments (from CapabilityIcon.tsx logic)
-- These rely on name matching logic, so icon is NULL
INSERT INTO capabilities (name, icon) VALUES
('Ukulele', NULL),
('Acoustic Guitar', NULL),
('Bass Guitar', NULL),
('Rhythm Guitar', NULL),
('Lead Guitar', NULL),
('Electric Guitar', NULL),
('Alto Saxophone', NULL),
('Tenor Saxophone', NULL),
('Baritone Saxophone', NULL),
('Soprano Saxophone', NULL),
('Upright Bass', NULL),
('Tambourine', NULL);
