/*
  # Fix missing user profiles

  1. Insert missing profiles for existing auth users
    - Admin user profile
    - Employee profiles for Jan and Marie

  2. Insert sample time entries
    - Time entries for existing projects and users
*/

-- Insert profiles for existing users (if they don't exist)
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

-- Insert sample time entries (if they don't exist)
INSERT INTO time_entries (id, "userId", date, "startTime", "endTime", "hoursWorked", "projectId", description) 
VALUES
  ('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '2024-12-01', '09:00', '17:00', 8, '660e8400-e29b-41d4-a716-446655440000', 'Vývoj frontendu obchodu'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-12-02', '08:30', '16:00', 7.5, '660e8400-e29b-41d4-a716-446655440000', 'Opravy chyb a testování'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-12-01', '08:00', '16:30', 8.5, '660e8400-e29b-41d4-a716-446655440001', 'Optimalizace databáze')
ON CONFLICT (id) DO NOTHING;