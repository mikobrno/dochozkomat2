/*
  # Fix infinite recursion in RLS policies

  1. New Function
    - `is_admin_user(user_id uuid)` - Security definer function to check admin role
    - Bypasses RLS to prevent recursion

  2. Updated Policies
    - Replace recursive EXISTS checks with function calls
    - Apply to profiles, projects, and time_entries tables

  3. Security
    - Function runs with definer rights to bypass RLS
    - Maintains proper access control without recursion
*/

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
DROP POLICY IF EXISTS "Admins can read all time entries" ON time_entries;
DROP POLICY IF EXISTS "Admins can manage all time entries" ON time_entries;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can read all time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage all time entries"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (public.is_admin_user(auth.uid()));