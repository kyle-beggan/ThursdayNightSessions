-- Create feedback_replies table
CREATE TABLE IF NOT EXISTS feedback_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view replies" 
    ON feedback_replies FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can add replies" 
    ON feedback_replies FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" 
    ON feedback_replies FOR DELETE 
    USING (auth.uid() = user_id);

-- Realtime (optional, good to have)
-- ALTER PUBLICATION supabase_realtime ADD TABLE feedback_replies;
