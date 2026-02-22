-- Remove 'Hanging Out' capability records if the user has other capabilities selected for that session commitment.
-- Capability ID: 117ce120-30a1-4cbc-97d3-32b8d2990616 ('Hanging Out')

DELETE FROM session_commitment_capabilities scc1
WHERE scc1.capability_id = '117ce120-30a1-4cbc-97d3-32b8d2990616'
AND EXISTS (
    SELECT 1 
    FROM session_commitment_capabilities scc2 
    WHERE scc2.session_commitment_id = scc1.session_commitment_id 
    AND scc2.capability_id != '117ce120-30a1-4cbc-97d3-32b8d2990616'
);
