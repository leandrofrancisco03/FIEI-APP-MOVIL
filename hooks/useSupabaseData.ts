import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { APP_CONFIG } from '@/lib/config';

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

  const sendChatMessage = async (message: string, userRole: string, userId: string, userEmail: string) => {
    try {
      setIsLoading(true);
      
      // Obtener el nombre del usuario desde el contexto de auth
      const userName = user?.nombres ? `${user.nombres} ${user.apellidos || ''}`.trim() : 'Usuario';
      
      const payload = {
        message,
        userId,
        userRole,
        userEmail,
        userName,
        timestamp: new Date().toISOString(),
      };
      
      console.log('🚀 Enviando mensaje al webhook:', payload);
      console.log('🔗 URL del webhook:', APP_CONFIG.WEBHOOK_URL);
      
      // Crear un timeout personalizado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ Timeout: Cancelando petición después de 30 segundos');
      }, APP_CONFIG.CHAT_CONFIG.TIMEOUT_MS); // Usar timeout desde config
      
      const response = await fetch(APP_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal, // Para poder cancelar la petición
      });

      // Limpiar el timeout si la petición fue exitosa
      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      // Verificar si hay contenido en la respuesta
      const contentType = response.headers.get('content-type');
      console.log('📡 Content-Type:', contentType);
      
      if (!contentType || contentType.indexOf('application/json') === -1) {
        console.log('⚠️ Respuesta no es JSON, intentando leer como texto');
        const textResponse = await response.text();
        console.log('📦 Respuesta como texto:', textResponse);
        
        if (!textResponse || textResponse.trim() === '') {
          throw new Error('Respuesta vacía del servidor');
        }
        
        return {
          success: true,
          response: textResponse,
        };
      }

      const data = await response.json();
      console.log('📦 Respuesta completa del webhook:', data);
      
      // Manejar diferentes formatos de respuesta
      let responseText = 'Respuesta recibida del asistente.';
      
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        // Formato: [{"output": "texto"}]
        responseText = data[0].output;
        console.log('✅ Usando formato array[0].output:', responseText);
      } else if (data.output) {
        // Formato: {"output": "texto"}
        responseText = data.output;
        console.log('✅ Usando formato data.output:', responseText);
      } else if (data.response) {
        // Formato: {"response": "texto"}
        responseText = data.response;
        console.log('✅ Usando formato data.response:', responseText);
      } else if (data.message) {
        // Formato: {"message": "texto"}
        responseText = data.message;
        console.log('✅ Usando formato data.message:', responseText);
      } else if (typeof data === 'string') {
        // Formato: "texto"
        responseText = data;
        console.log('✅ Usando formato string directo:', responseText);
      } else {
        console.log('⚠️ Formato no reconocido, usando respuesta por defecto');
        console.log('📦 Estructura completa de data:', JSON.stringify(data, null, 2));
      }
      
      return {
        success: true,
        response: responseText,
      };
    } catch (error: any) {
      console.error('❌ Error sending chat message:', error);
      
      if (error?.name === 'AbortError') {
        return {
          success: false,
          error: 'La petición ha tardado demasiado tiempo. El servidor puede estar ocupado, inténtalo de nuevo.',
        };
      }
      
      if (error?.message && error.message.indexOf('fetch') !== -1) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
        };
      }
      
      return {
        success: false,
        error: `Error al enviar el mensaje: ${error?.message || 'Error desconocido'}. Por favor, inténtalo de nuevo.`,
      };
    } finally {
      setIsLoading(false);
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
    getEnrolledStudents,
    sendChatMessage
  };
}