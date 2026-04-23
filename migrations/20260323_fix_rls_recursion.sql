-- Fix RLS Infinite Recursion for users table
-- Date: 2026-03-23
-- Purpose: Resolve "infinite recursion detected in policy for relation 'users'"

-- 1. Create security definer functions to safely check user properties
-- These functions run with the privileges of the creator (bypass RLS on the users table)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_approved(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update users table policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Recreate policies using the safe functions
CREATE POLICY "Admins can view all users" 
ON users FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage users" 
ON users FOR ALL 
USING (is_admin(auth.uid()));

-- 3. Update related table policies for safety and consistency
-- CAPABILITIES
DROP POLICY IF EXISTS "Approved users can view capabilities" ON capabilities;
DROP POLICY IF EXISTS "Authenticated users can view capabilities" ON capabilities;
CREATE POLICY "Everyone can view capabilities" 
ON capabilities FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage capabilities" ON capabilities;
CREATE POLICY "Admins can manage capabilities" 
ON capabilities FOR ALL 
USING (is_admin(auth.uid()));

-- USER CAPABILITIES
DROP POLICY IF EXISTS "Authenticated users can view user capabilities" ON user_capabilities;
CREATE POLICY "Authenticated users can view user capabilities" 
ON user_capabilities FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage user capabilities" ON user_capabilities;
CREATE POLICY "Admins can manage user capabilities" 
ON user_capabilities FOR ALL 
USING (is_admin(auth.uid()));

-- SESSIONS
DROP POLICY IF EXISTS "Admins can manage sessions" ON sessions;
CREATE POLICY "Admins can manage sessions" 
ON sessions FOR ALL 
USING (is_admin(auth.uid()));

-- SESSION COMMITMENTS
DROP POLICY IF EXISTS "Admins can manage commitments" ON session_commitments;
CREATE POLICY "Admins can manage commitments" 
ON session_commitments FOR ALL 
USING (is_admin(auth.uid()));
