-- Drop existing check constraint
ALTER TABLE feedback DROP CONSTRAINT feedback_status_check;

-- Map old values to new ones
UPDATE feedback 
SET status = CASE
    WHEN status = 'reviewed' THEN 'in_progress'
    WHEN status = 'implemented' THEN 'completed'
    WHEN status = 'closed' THEN 'rejected'
    ELSE status
END;

-- Add new check constraint
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check 
CHECK (status IN ('pending', 'rejected', 'in_progress', 'completed'));
