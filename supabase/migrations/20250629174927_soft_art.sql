/*
  # Fix RLS Policy Issues

  1. Drop and recreate problematic policies to avoid infinite recursion
  2. Add INSERT policy for usuarios table to allow registration
  3. Simplify policies to avoid circular dependencies

  This migration fixes:
  - Infinite recursion in matriculas table policy
  - RLS policy violation preventing user registration
*/

-- Drop ALL existing policies that might cause conflicts
DROP POLICY IF EXISTS "Students can read own data" ON estudiantes;
DROP POLICY IF EXISTS "Professors can read students in their courses" ON estudiantes;
DROP POLICY IF EXISTS "Students can read their professors" ON profesores;
DROP POLICY IF EXISTS "Professors can read own data" ON profesores;
DROP POLICY IF EXISTS "Students can read their enrolled sections" ON secciones;
DROP POLICY IF EXISTS "Professors can read their assigned sections" ON secciones;
DROP POLICY IF EXISTS "Students can read own enrollments" ON matriculas;
DROP POLICY IF EXISTS "Professors can read enrollments in their courses" ON matriculas;

-- Add INSERT policy for usuarios table to allow registration
DROP POLICY IF EXISTS "Allow user registration" ON usuarios;
CREATE POLICY "Allow user registration"
  ON usuarios
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Recreate estudiantes policies (simplified to avoid recursion)
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

-- Recreate profesores policies (simplified to avoid recursion)
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

-- Recreate secciones policies (simplified to avoid recursion)
CREATE POLICY "Professors can read their sections"
  ON secciones
  FOR SELECT
  TO authenticated
  USING (id_profesor = auth.uid());

CREATE POLICY "Students can read sections"
  ON secciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol = 'estudiante'
    )
  );

-- Recreate matriculas policies (simplified to avoid recursion)
CREATE POLICY "Students can read own enrollments"
  ON matriculas
  FOR SELECT
  TO authenticated
  USING (id_estudiante = auth.uid());

CREATE POLICY "Professors can read enrollments"
  ON matriculas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol = 'profesor'
    )
  );