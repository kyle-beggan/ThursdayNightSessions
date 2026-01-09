-- Create session_commitment_capabilities table
CREATE TABLE session_commitment_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_commitment_id UUID NOT NULL REFERENCES session_commitments(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_commitment_id, capability_id)
);

-- Enable RLS
ALTER TABLE session_commitment_capabilities ENABLE ROW LEVEL SECURITY;

-- Policies

-- Approved users can view commitment capabilities
CREATE POLICY "Approved users can view commitment capabilities"
  ON session_commitment_capabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

-- Users can insert capabilities for their own commitments
CREATE POLICY "Users can add capabilities to their own commitments"
  ON session_commitment_capabilities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_commitments sc
      WHERE sc.id = session_commitment_id
      AND sc.user_id = auth.uid()
    )
  );

-- Users can delete capabilities from their own commitments
CREATE POLICY "Users can remove capabilities from their own commitments"
  ON session_commitment_capabilities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM session_commitments sc
      WHERE sc.id = session_commitment_id
      AND sc.user_id = auth.uid()
    )
  );

-- Admins can manage all commitment capabilities
CREATE POLICY "Admins can manage commitment capabilities"
  ON session_commitment_capabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Create index for performance
CREATE INDEX idx_commitment_capabilities_commitment_id ON session_commitment_capabilities(session_commitment_id);
