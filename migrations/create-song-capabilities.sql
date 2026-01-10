-- Create song_capabilities table for many-to-many relationship
CREATE TABLE IF NOT EXISTS song_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(song_id, capability_id)
);

-- Enable RLS
ALTER TABLE song_capabilities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read for song_capabilities" 
    ON song_capabilities FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated insert for song_capabilities" 
    ON song_capabilities FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete for song_capabilities" 
    ON song_capabilities FOR DELETE 
    USING (auth.role() = 'authenticated');
