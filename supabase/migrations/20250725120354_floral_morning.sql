/*
  # Create initial test users

  1. Create test users in auth.users table
    - Admin user: admin@firma.cz
    - Employee users: jan.novak@firma.cz, marie.svobodova@firma.cz

  2. Create corresponding profiles
    - Link profiles to auth users
    - Set appropriate roles and rates
*/

-- Note: This migration creates users directly in auth.users
-- In production, users should be created through Supabase Auth signup

-- Insert admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000',
  'authenticated',
  'authenticated',
  'admin@firma.cz',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert employee user 1
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440001',
  'authenticated',
  'authenticated',
  'jan.novak@firma.cz',
  crypt('heslo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert employee user 2
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440002',
  'authenticated',
  'authenticated',
  'marie.svobodova@firma.cz',
  crypt('heslo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Ensure profiles exist for these users
INSERT INTO profiles (id, "firstName", "lastName", role, "hourlyRate", "monthlyDeductions", "isActive") 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Admin', 'Systému', 'admin', 0, 0, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Jan', 'Novák', 'employee', 450, 8500, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Marie', 'Svobodová', 'employee', 520, 9200, true)
ON CONFLICT (id) DO UPDATE SET
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  role = EXCLUDED.role,
  "hourlyRate" = EXCLUDED."hourlyRate",
  "monthlyDeductions" = EXCLUDED."monthlyDeductions",
  "isActive" = EXCLUDED."isActive";