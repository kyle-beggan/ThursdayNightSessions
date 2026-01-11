CREATE TABLE IF NOT EXISTS chat_read_receipts (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL for global chat
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, session_id) -- Composite PK acts as unique constraint
);

-- Handle NULL in composite primary key workaround (Postgres PKs can't have NULLs)
-- Actually, a better approach for NULLable FK in a unique constraint is a UNIQUE INDEX
-- Let's adjust to use ID as PK and a UNIQUE INDEX on (user_id, session_id) treating NULLs as distinct

DROP TABLE IF EXISTS chat_read_receipts;

CREATE TABLE chat_read_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL for global chat
    last_read_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a unique index that treats NULL session_id as a unique value per user
CREATE UNIQUE INDEX chat_read_receipts_user_session_idx ON chat_read_receipts (user_id, (session_id IS NULL)) WHERE session_id IS NULL;
CREATE UNIQUE INDEX chat_read_receipts_user_session_val_idx ON chat_read_receipts (user_id, session_id) WHERE session_id IS NOT NULL;
