-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;

-- Create new permissive policy for authenticated users
CREATE POLICY "Authenticated users can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);
