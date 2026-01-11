-- Add image column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;

-- Verify column addition (optional, but good for logs)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'image') THEN
        RAISE NOTICE 'Column image added to users table successfully';
    END IF;
END $$;
