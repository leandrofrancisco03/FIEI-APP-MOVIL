import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname
    const searchParams = url.searchParams

    // Get user courses (for students)
    if (path === '/academic/student-courses' && req.method === 'GET') {
      const semester = searchParams.get('semester')
      const userId = searchParams.get('user_id')

      const { data, error } = await supabaseClient
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
        .eq('secciones.periodo_academico', semester)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get professor courses
    if (path === '/academic/professor-courses' && req.method === 'GET') {
      const semester = searchParams.get('semester')
      const userId = searchParams.get('user_id')

      const { data, error } = await supabaseClient
        .from('secciones')
        .select(`
          id,
          nombre,
          horario,
          periodo_academico,
          fecha_inicio,
          fecha_fin,
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
        .eq('id_profesor', userId)
        .eq('periodo_academico', semester)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get student grades
    if (path === '/academic/student-grades' && req.method === 'GET') {
      const semester = searchParams.get('semester')
      const userId = searchParams.get('user_id')

      const { data, error } = await supabaseClient
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
            secciones (
              codigo_curso,
              periodo_academico
            )
          )
        `)
        .eq('matriculas.id_estudiante', userId)
        .eq('matriculas.secciones.periodo_academico', semester)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Search courses
    if (path === '/academic/search-courses' && req.method === 'GET') {
      const query = searchParams.get('query')
      const escuelaId = searchParams.get('escuela_id')

      let queryBuilder = supabaseClient
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
        `)

      if (escuelaId) {
        queryBuilder = queryBuilder.eq('curso_escuela.id_escuela', escuelaId)
      }

      if (query) {
        queryBuilder = queryBuilder.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`)
      }

      const { data, error } = await queryBuilder

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Search student by code
    if (path === '/academic/search-student' && req.method === 'GET') {
      const codigo = searchParams.get('codigo')

      const { data, error } = await supabaseClient
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
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Student not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert/Update grade
    if (path === '/academic/grades' && req.method === 'POST') {
      const { 
        codigo_curso, 
        codigo_estudiante, 
        tipo_nota, 
        nota, 
        observaciones,
        id_profesor 
      } = await req.json()

      // First, find the matricula ID
      const { data: matriculaData, error: matriculaError } = await supabaseClient
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
        .eq('estudiantes.codigo', codigo_estudiante)
        .eq('secciones.codigo_curso', codigo_curso)
        .eq('secciones.id_profesor', id_profesor)
        .single()

      if (matriculaError) {
        return new Response(
          JSON.stringify({ error: 'Enrollment not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if grade record exists
      const { data: existingGrade } = await supabaseClient
        .from('notas')
        .select('id')
        .eq('id_matricula', matriculaData.id)
        .single()

      const gradeData = {
        id_matricula: matriculaData.id,
        [tipo_nota === 'parcial' ? 'examen_parcial' : 
         tipo_nota === 'final' ? 'examen_final' : 'nota_tareas']: nota,
        observaciones,
        id_profesor_registro: id_profesor
      }

      let result
      if (existingGrade) {
        // Update existing grade
        result = await supabaseClient
          .from('notas')
          .update(gradeData)
          .eq('id', existingGrade.id)
      } else {
        // Insert new grade
        result = await supabaseClient
          .from('notas')
          .insert(gradeData)
      }

      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Grade saved successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert attendance
    if (path === '/academic/attendance' && req.method === 'POST') {
      const { 
        codigo_curso, 
        codigo_estudiante, 
        fecha, 
        estado, 
        observacion,
        id_profesor 
      } = await req.json()

      // Find the matricula ID
      const { data: matriculaData, error: matriculaError } = await supabaseClient
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
        .eq('estudiantes.codigo', codigo_estudiante)
        .eq('secciones.codigo_curso', codigo_curso)
        .eq('secciones.id_profesor', id_profesor)
        .single()

      if (matriculaError) {
        return new Response(
          JSON.stringify({ error: 'Enrollment not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Insert attendance record
      const { error } = await supabaseClient
        .from('asistencias')
        .insert({
          id_matricula: matriculaData.id,
          fecha,
          estado,
          observacion,
          id_profesor_registro: id_profesor
        })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Attendance recorded successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get enrolled students in a section
    if (path === '/academic/enrolled-students' && req.method === 'GET') {
      const sectionId = searchParams.get('section_id')

      const { data, error } = await supabaseClient
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
        .eq('id_seccion', sectionId)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})