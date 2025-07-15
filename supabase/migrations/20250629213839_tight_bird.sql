/*
  # Fix Student Registration Issues

  1. Update RLS policies to allow proper registration
  2. Fix policies that prevent student/professor data insertion during registration
  3. Ensure proper data flow during user registration

  This migration fixes:
  - RLS policies preventing student/professor data insertion
  - Missing policies for INSERT operations on estudiantes and profesores tables
*/

-- Drop existing problematic policies for estudiantes and profesores
DROP POLICY IF EXISTS "Students can read own data" ON estudiantes;
DROP POLICY IF EXISTS "Professors can read students data" ON estudiantes;
DROP POLICY IF EXISTS "Professors can read own data" ON profesores;
DROP POLICY IF EXISTS "Students can read professors data" ON profesores;

-- Add INSERT policies for registration
CREATE POLICY "Allow student registration"
  ON estudiantes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow professor registration"
  ON profesores
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Recreate SELECT policies (simplified to avoid recursion)
CREATE POLICY "Students can read own data"
  ON estudiantes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Professors can read students data"
  ON estudiantes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol = 'profesor'
    )
  );

CREATE POLICY "Professors can read own data"
  ON profesores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can read professors data"
  ON profesores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol = 'estudiante'
    )
  );

-- Add UPDATE policies for users to update their own data
CREATE POLICY "Students can update own data"
  ON estudiantes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Professors can update own data"
  ON profesores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);