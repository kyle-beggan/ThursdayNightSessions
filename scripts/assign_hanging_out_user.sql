-- Add 'Hanging Out' capability to every session commitment for a specific user.
-- User ID: 1695ff3e-9c73-400d-afd5-429d6640c8e7
-- Capability ID: 117ce120-30a1-4cbc-97d3-32b8d2990616 ('Hanging Out')

INSERT INTO session_commitment_capabilities (session_commitment_id, capability_id)
SELECT id, '117ce120-30a1-4cbc-97d3-32b8d2990616'
FROM session_commitments
WHERE user_id = '1695ff3e-9c73-400d-afd5-429d6640c8e7'
ON CONFLICT DO NOTHING;
