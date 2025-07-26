/*
  # Create initial database schema for time tracking system

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `firstName` (text)
      - `lastName` (text)
      - `email` (text, unique)
      - `password` (text)
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
      - `userId` (uuid, foreign key)
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
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
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
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "hoursWorked" numeric NOT NULL,
  "projectId" uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description text,
  "createdAt" timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
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
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Create policies for time_entries table
CREATE POLICY "Users can read own time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING ("userId"::text = auth.uid()::text);

CREATE POLICY "Admins can read all time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own time entries"
  ON time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId"::text = auth.uid()::text);

CREATE POLICY "Users can update own time entries"
  ON time_entries
  FOR UPDATE
  TO authenticated
  USING ("userId"::text = auth.uid()::text);

CREATE POLICY "Admins can manage all time entries"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Insert initial data
INSERT INTO users (id, "firstName", "lastName", email, password, role, "hourlyRate", "monthlyDeductions", "isActive") VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Admin', 'Systému', 'admin@firma.cz', 'admin123', 'admin', 0, 0, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Jan', 'Novák', 'jan.novak@firma.cz', 'heslo123', 'employee', 450, 8500, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Marie', 'Svobodová', 'marie.svobodova@firma.cz', 'heslo123', 'employee', 520, 9200, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, name, "isActive") VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'E-commerce platforma', true),
  ('660e8400-e29b-41d4-a716-446655440001', 'CRM systém', true),
  ('660e8400-e29b-41d4-a716-446655440002', 'Mobilní aplikace', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO time_entries (id, "userId", date, "startTime", "endTime", "hoursWorked", "projectId", description) VALUES
  ('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '2024-12-01', '09:00', '17:00', 8, '660e8400-e29b-41d4-a716-446655440000', 'Vývoj frontendu obchodu'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-12-02', '08:30', '16:00', 7.5, '660e8400-e29b-41d4-a716-446655440000', 'Opravy chyb a testování'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-12-01', '08:00', '16:30', 8.5, '660e8400-e29b-41d4-a716-446655440001', 'Optimalizace databáze')
ON CONFLICT (id) DO NOTHING;