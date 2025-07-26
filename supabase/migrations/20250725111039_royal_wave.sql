/*
  # Create initial database schema for time tracking system with Supabase Auth integration

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `firstName` (text)
      - `lastName` (text)
      - `role` (text)
      - `hourlyRate` (numeric)
      - `monthlyDeductions` (numeric)
      - `isActive` (boolean)
      - `createdAt` (timestamp)
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `isActive` (boolean)
      - `createdAt` (timestamp)
    - `time_entries`
      - `id` (uuid, primary key)
      - `userId` (uuid, foreign key to profiles)
      - `date` (date)
      - `startTime` (text)
      - `endTime` (text)
      - `hoursWorked` (numeric)
      - `projectId` (uuid, foreign key)
      - `description` (text, nullable)
      - `createdAt` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create admin and employee users in auth.users
*/

-- Create profiles table (replaces users table)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  "hourlyRate" numeric NOT NULL DEFAULT 0,
  "monthlyDeductions" numeric NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz DEFAULT now()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "hoursWorked" numeric NOT NULL,
  "projectId" uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description text,
  "createdAt" timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create policies for projects table
CREATE POLICY "All authenticated users can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create policies for time_entries table
CREATE POLICY "Users can read own time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Admins can read all time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own time entries"
  ON time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own time entries"
  ON time_entries
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Admins can manage all time entries"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Insert initial projects
INSERT INTO projects (id, name, "isActive") VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'E-commerce platforma', true),
  ('660e8400-e29b-41d4-a716-446655440001', 'CRM systém', true),
  ('660e8400-e29b-41d4-a716-446655440002', 'Mobilní aplikace', true)
ON CONFLICT (name) DO NOTHING;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, "firstName", "lastName", role, "hourlyRate", "monthlyDeductions")
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'firstName', 'User'),
    COALESCE(new.raw_user_meta_data->>'lastName', 'Name'),
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE((new.raw_user_meta_data->>'hourlyRate')::numeric, 450),
    COALESCE((new.raw_user_meta_data->>'monthlyDeductions')::numeric, 8500)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();