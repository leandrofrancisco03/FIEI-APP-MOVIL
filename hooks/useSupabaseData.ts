import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useSupabaseData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const getSemesters = () => ['2025-I', '2024-II', '2024-I', '2023-II', '2023-I'];

  const getUserCourses = async (userId: string, semester: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('matriculas')
        .select(`
          id,
          fecha_matricula,
          estado,
          secciones (
            id,
            nombre,
            horario,
            periodo_academico,
            codigo_curso,
            cursos (
              codigo,
              nombre,
              creditos,
              horas_teoria,
              horas_practica
            ),
            profesores (
              codigo_profesor,
              usuarios (
                nombres,
                apellidos
              )
            )
          )
        `)
        .eq('id_estudiante', userId)
        .eq('secciones.periodo_academico', semester);

      if (error) throw error;
      return data?.map(m => ({
        id: m.secciones?.id || 0,
        nombre: m.secciones?.nombre || '',
        codigo_curso: m.secciones?.codigo_curso || '',
        horario: m.secciones?.horario,
        periodo_academico: m.secciones?.periodo_academico || '',
        curso: m.secciones?.cursos,
        profesor: m.secciones?.profesores
      })) || [];
    } catch (error) {
      console.error('Error fetching user courses:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentGrades = async (userId: string, semester: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notas')
        .select(`
          id,
          examen_parcial,
          examen_final,
          nota_tareas,
          promedio_final,
          observaciones,
          fecha_registro,
          fecha_actualizacion,
          matriculas (
            id_estudiante,
            secciones (
              codigo_curso,
              periodo_academico
            )
          )
        `)
        .eq('matriculas.id_estudiante', userId)
        .eq('matriculas.secciones.periodo_academico', semester);

      if (error) throw error;
      return data?.map(grade => ({
        ...grade,
        codigo_curso: grade.matriculas?.secciones?.codigo_curso || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching student grades:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getProfessorCourses = async (professorId: string, semester: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('secciones')
        .select(`
          id,
          nombre,
          horario,
          periodo_academico,
          fecha_inicio,
          fecha_fin,
          codigo_curso,
          cursos (
            codigo,
            nombre,
            creditos,
            horas_teoria,
            horas_practica
          ),
          escuelas (
            nombre
          )
        `)
        .eq('id_profesor', professorId)
        .eq('periodo_academico', semester);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching professor courses:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const searchCourses = async (query: string, escuelaId: number) => {
    if (!query.trim()) return [];
    
    try {
      setIsLoading(true);
      let queryBuilder = supabase
        .from('cursos')
        .select(`
          codigo,
          nombre,
          creditos,
          horas_teoria,
          horas_practica,
          curso_escuela!inner (
            id_escuela
          )
        `);

      if (escuelaId) {
        queryBuilder = queryBuilder.eq('curso_escuela.id_escuela', escuelaId);
      }

      queryBuilder = queryBuilder.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`);

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching courses:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const searchStudentByCode = async (codigo: string) => {
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select(`
          id,
          codigo,
          usuarios (
            nombres,
            apellidos,
            email
          ),
          escuelas (
            nombre
          )
        `)
        .eq('codigo', codigo)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching student:', error);
      return null;
    }
  };

  const insertGrade = async (gradeData: {
    codigo_curso: string;
    codigo_estudiante: string;
    tipo_nota: 'parcial' | 'final' | 'tareas';
    nota: number;
    observaciones: string;
    id_profesor: string;
  }) => {
    try {
      setIsLoading(true);

      // Find the matricula ID
      const { data: matriculaData, error: matriculaError } = await supabase
        .from('matriculas')
        .select(`
          id,
          secciones (
            codigo_curso,
            id_profesor
          ),
          estudiantes (
            codigo
          )
        `)
        .eq('estudiantes.codigo', gradeData.codigo_estudiante)
        .eq('secciones.codigo_curso', gradeData.codigo_curso)
        .eq('secciones.id_profesor', gradeData.id_profesor)
        .single();

      if (matriculaError) throw matriculaError;

      // Check if grade record exists
      const { data: existingGrade } = await supabase
        .from('notas')
        .select('id')
        .eq('id_matricula', matriculaData.id)
        .single();

      const updateData = {
        id_matricula: matriculaData.id,
        [gradeData.tipo_nota === 'parcial' ? 'examen_parcial' : 
         gradeData.tipo_nota === 'final' ? 'examen_final' : 'nota_tareas']: gradeData.nota,
        observaciones: gradeData.observaciones,
        id_profesor_registro: gradeData.id_profesor
      };

      let result;
      if (existingGrade) {
        // Update existing grade
        result = await supabase
          .from('notas')
          .update(updateData)
          .eq('id', existingGrade.id);
      } else {
        // Insert new grade
        result = await supabase
          .from('notas')
          .insert(updateData);
      }

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error inserting grade:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerAttendance = async (attendanceData: {
    codigo_curso: string;
    codigo_estudiante: string;
    fecha: string;
    estado: 'Presente' | 'Tardanza' | 'Ausente';
    observacion: string;
    id_profesor: string;
  }) => {
    try {
      setIsLoading(true);

      // Find the matricula ID
      const { data: matriculaData, error: matriculaError } = await supabase
        .from('matriculas')
        .select(`
          id,
          secciones (
            codigo_curso,
            id_profesor
          ),
          estudiantes (
            codigo
          )
        `)
        .eq('estudiantes.codigo', attendanceData.codigo_estudiante)
        .eq('secciones.codigo_curso', attendanceData.codigo_curso)
        .eq('secciones.id_profesor', attendanceData.id_profesor)
        .single();

      if (matriculaError) throw matriculaError;

      // Insert attendance record
      const { error } = await supabase
        .from('asistencias')
        .insert({
          id_matricula: matriculaData.id,
          fecha: attendanceData.fecha,
          estado: attendanceData.estado,
          observacion: attendanceData.observacion,
          id_profesor_registro: attendanceData.id_profesor
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error registering attendance:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentAttendances = async (userId: string, semester: string) => {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select(`
          id,
          fecha,
          estado,
          observacion,
          matriculas (
            secciones (
              codigo_curso,
              periodo_academico,
              cursos (
                codigo,
                nombre
              )
            )
          )
        `)
        .eq('matriculas.id_estudiante', userId)
        .eq('matriculas.secciones.periodo_academico', semester)
        .order('fecha', { ascending: false });

      if (error) throw error;
      
      // Transformar los datos para que sean más fáciles de usar
      return data?.map(attendance => ({
        id: attendance.id,
        fecha: attendance.fecha,
        estado: attendance.estado,
        observacion: attendance.observacion,
        codigo_curso: attendance.matriculas?.secciones?.codigo_curso,
        curso_nombre: attendance.matriculas?.secciones?.cursos?.nombre
      })) || [];
    } catch (error) {
      console.error('Error fetching student attendances:', error);
      return [];
    }
  };

  const getEnrolledStudents = async (seccionId: number) => {
    try {
      const { data, error } = await supabase
        .from('matriculas')
        .select(`
          id,
          fecha_matricula,
          estado,
          estudiantes (
            codigo,
            usuarios (
              nombres,
              apellidos,
              email
            )
          )
        `)
        .eq('id_seccion', seccionId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      return [];
    }
  };

  return {
    isLoading,
    getSemesters,
    getUserCourses,
    getStudentGrades,
    getProfessorCourses,
    searchCourses,
    searchStudentByCode,
    insertGrade,
    registerAttendance,
    getStudentAttendances,
    getEnrolledStudents
  };
}