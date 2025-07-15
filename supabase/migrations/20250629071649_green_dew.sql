/*
  # UNFV Academic System Database Schema

  1. New Tables
    - `usuarios` - Base user authentication and personal information
    - `estudiantes` - Student-specific data with codes and school assignments
    - `profesores` - Professor-specific data with codes and specializations
    - `escuelas` - Engineering schools (Electrónica, Informática, Telecomunicaciones, Mecatrónica)
    - `cursos` - Course catalog with credits and hours
    - `curso_escuela` - Many-to-many relationship between courses and schools
    - `secciones` - Course sections with professor assignments and schedules
    - `matriculas` - Student enrollments in course sections
    - `notas` - Grade records with automatic final grade calculation
    - `asistencias` - Attendance tracking with status and observations

  2. Security
    - Enable RLS on all tables
    - Students can only access their own data
    - Professors can only access data for courses they teach
    - Public read access for schools and courses for search functionality

  3. Features
    - Automatic final grade calculation using trigger (30% Parcial + 30% Final + 40% Tareas)
    - Comprehensive audit trail with timestamps
    - Data integrity with foreign key constraints
    - Optimized indexes for performance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create usuarios table (base user table)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT,
  genero TEXT CHECK (genero IN ('M', 'F')),
  fecha_nacimiento DATE NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('estudiante', 'profesor')),
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  ultima_conexion TIMESTAMPTZ,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create escuelas table
CREATE TABLE IF NOT EXISTS escuelas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  facultad TEXT DEFAULT 'Facultad de Ingeniería',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create estudiantes table
CREATE TABLE IF NOT EXISTS estudiantes (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo TEXT UNIQUE NOT NULL,
  id_escuela INTEGER NOT NULL REFERENCES escuelas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profesores table
CREATE TABLE IF NOT EXISTS profesores (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_profesor TEXT UNIQUE NOT NULL,
  especialidad TEXT,
  grado_academico TEXT CHECK (grado_academico IN ('Licenciado', 'Magister', 'Doctor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cursos table
CREATE TABLE IF NOT EXISTS cursos (
  codigo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creditos INTEGER DEFAULT 3 CHECK (creditos > 0),
  horas_teoria INTEGER DEFAULT 2 CHECK (horas_teoria >= 0),
  horas_practica INTEGER DEFAULT 2 CHECK (horas_practica >= 0),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create curso_escuela table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS curso_escuela (
  id SERIAL PRIMARY KEY,
  codigo_curso TEXT NOT NULL REFERENCES cursos(codigo) ON DELETE CASCADE,
  id_escuela INTEGER NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
  ciclo INTEGER DEFAULT 1 CHECK (ciclo > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(codigo_curso, id_escuela)
);

-- Create secciones table
CREATE TABLE IF NOT EXISTS secciones (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_curso TEXT NOT NULL REFERENCES cursos(codigo),
  id_escuela INTEGER NOT NULL REFERENCES escuelas(id),
  id_profesor UUID NOT NULL REFERENCES profesores(id),
  horario TEXT,
  periodo_academico TEXT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nombre, codigo_curso, periodo_academico, id_escuela)
);

-- Create matriculas table
CREATE TABLE IF NOT EXISTS matriculas (
  id SERIAL PRIMARY KEY,
  id_estudiante UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  id_seccion INTEGER NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  fecha_matricula TIMESTAMPTZ DEFAULT NOW(),
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Retirado', 'Completado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_estudiante, id_seccion)
);

-- Create notas table
CREATE TABLE IF NOT EXISTS notas (
  id SERIAL PRIMARY KEY,
  id_matricula INTEGER NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  examen_parcial DECIMAL(4,2) CHECK (examen_parcial >= 0 AND examen_parcial <= 20),
  examen_final DECIMAL(4,2) CHECK (examen_final >= 0 AND examen_final <= 20),
  nota_tareas DECIMAL(4,2) CHECK (nota_tareas >= 0 AND nota_tareas <= 20),
  promedio_final DECIMAL(4,2) CHECK (promedio_final >= 0 AND promedio_final <= 20),
  observaciones TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  id_profesor_registro UUID NOT NULL REFERENCES profesores(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_matricula)
);

-- Create asistencias table
CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  id_matricula INTEGER NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado TEXT DEFAULT 'Presente' CHECK (estado IN ('Presente', 'Tardanza', 'Ausente')),
  observacion TEXT,
  id_profesor_registro UUID NOT NULL REFERENCES profesores(id),
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_matricula, fecha)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo);
CREATE INDEX IF NOT EXISTS idx_profesores_codigo ON profesores(codigo_profesor);
CREATE INDEX IF NOT EXISTS idx_secciones_periodo ON secciones(periodo_academico);
CREATE INDEX IF NOT EXISTS idx_secciones_profesor ON secciones(id_profesor);
CREATE INDEX IF NOT EXISTS idx_matriculas_estudiante ON matriculas(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_matriculas_seccion ON matriculas(id_seccion);
CREATE INDEX IF NOT EXISTS idx_notas_matricula ON notas(id_matricula);
CREATE INDEX IF NOT EXISTS idx_asistencias_matricula ON asistencias(id_matricula);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);

-- Function to automatically calculate final grade
CREATE OR REPLACE FUNCTION calculate_final_grade()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate final grade using the formula: 30% Parcial + 30% Final + 40% Tareas
  IF NEW.examen_parcial IS NOT NULL AND NEW.examen_final IS NOT NULL AND NEW.nota_tareas IS NOT NULL THEN
    NEW.promedio_final := ROUND(
      (NEW.examen_parcial * 0.30) + 
      (NEW.examen_final * 0.30) + 
      (NEW.nota_tareas * 0.40), 
      2
    );
  ELSE
    NEW.promedio_final := NULL;
  END IF;
  
  NEW.fecha_actualizacion := NOW();
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic grade calculation
DROP TRIGGER IF EXISTS trigger_calculate_final_grade ON notas;
CREATE TRIGGER trigger_calculate_final_grade
  BEFORE INSERT OR UPDATE ON notas
  FOR EACH ROW
  EXECUTE FUNCTION calculate_final_grade();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escuelas_updated_at BEFORE UPDATE ON escuelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profesores_updated_at BEFORE UPDATE ON profesores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_secciones_updated_at BEFORE UPDATE ON secciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON matriculas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON notas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE escuelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_escuela ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios table
CREATE POLICY "Users can read own data" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for escuelas table (public read access for search)
CREATE POLICY "Public read access for escuelas" ON escuelas
  FOR SELECT USING (true);

-- RLS Policies for estudiantes table
CREATE POLICY "Students can read own data" ON estudiantes
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Professors can read students in their courses" ON estudiantes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id_estudiante = estudiantes.id
      AND s.id_profesor = auth.uid()
    )
  );

-- RLS Policies for profesores table
CREATE POLICY "Professors can read own data" ON profesores
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can read their professors" ON profesores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE s.id_profesor = profesores.id
      AND m.id_estudiante = auth.uid()
    )
  );

-- RLS Policies for cursos table (public read access for search)
CREATE POLICY "Public read access for cursos" ON cursos
  FOR SELECT USING (true);

-- RLS Policies for curso_escuela table (public read access)
CREATE POLICY "Public read access for curso_escuela" ON curso_escuela
  FOR SELECT USING (true);

-- RLS Policies for secciones table
CREATE POLICY "Students can read their enrolled sections" ON secciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      WHERE m.id_seccion = secciones.id
      AND m.id_estudiante = auth.uid()
    )
  );

CREATE POLICY "Professors can read their assigned sections" ON secciones
  FOR SELECT USING (id_profesor = auth.uid());

-- RLS Policies for matriculas table
CREATE POLICY "Students can read own enrollments" ON matriculas
  FOR SELECT USING (id_estudiante = auth.uid());

CREATE POLICY "Professors can read enrollments in their courses" ON matriculas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM secciones s
      WHERE s.id = matriculas.id_seccion
      AND s.id_profesor = auth.uid()
    )
  );

-- RLS Policies for notas table
CREATE POLICY "Students can read own grades" ON notas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      WHERE m.id = notas.id_matricula
      AND m.id_estudiante = auth.uid()
    )
  );

CREATE POLICY "Professors can read grades for their courses" ON notas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id = notas.id_matricula
      AND s.id_profesor = auth.uid()
    )
  );

CREATE POLICY "Professors can insert grades for their courses" ON notas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id = notas.id_matricula
      AND s.id_profesor = auth.uid()
    )
  );

CREATE POLICY "Professors can update grades for their courses" ON notas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id = notas.id_matricula
      AND s.id_profesor = auth.uid()
    )
  );

-- RLS Policies for asistencias table
CREATE POLICY "Students can read own attendance" ON asistencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      WHERE m.id = asistencias.id_matricula
      AND m.id_estudiante = auth.uid()
    )
  );

CREATE POLICY "Professors can read attendance for their courses" ON asistencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id = asistencias.id_matricula
      AND s.id_profesor = auth.uid()
    )
  );

CREATE POLICY "Professors can insert attendance for their courses" ON asistencias
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id = asistencias.id_matricula
      AND s.id_profesor = auth.uid()
    )
  );

CREATE POLICY "Professors can update attendance for their courses" ON asistencias
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN secciones s ON m.id_seccion = s.id
      WHERE m.id = asistencias.id_matricula
      AND s.id_profesor = auth.uid()
    )
  );

-- Insert engineering schools data
INSERT INTO escuelas (nombre, facultad) VALUES
('Ingeniería Electrónica', 'Facultad de Ingeniería'),
('Ingeniería Informática', 'Facultad de Ingeniería'),
('Ingeniería en Telecomunicaciones', 'Facultad de Ingeniería'),
('Ingeniería Mecatrónica', 'Facultad de Ingeniería')
ON CONFLICT DO NOTHING;