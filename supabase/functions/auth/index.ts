import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  dni: string
  nombres: string
  apellidos: string
  telefono?: string
  genero?: string
  fecha_nacimiento: string
  rol: 'estudiante' | 'profesor'
  codigo?: string
  codigo_profesor?: string
  id_escuela?: number
  especialidad?: string
  grado_academico?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname

    if (path === '/auth/login' && req.method === 'POST') {
      const { email, password }: LoginRequest = await req.json()

      // Authenticate user
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get user details from usuarios table
      const { data: userData, error: userError } = await supabaseClient
        .from('usuarios')
        .select(`
          id,
          email,
          nombres,
          apellidos,
          rol,
          estudiantes (codigo, id_escuela),
          profesores (codigo_profesor)
        `)
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        return new Response(
          JSON.stringify({ error: 'User data not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Format user data for frontend
      const user = {
        id: userData.id,
        email: userData.email,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        rol: userData.rol,
        codigo: userData.estudiantes?.[0]?.codigo,
        codigo_profesor: userData.profesores?.[0]?.codigo_profesor,
        id_escuela: userData.estudiantes?.[0]?.id_escuela,
      }

      // Update last connection
      await supabaseClient
        .from('usuarios')
        .update({ ultima_conexion: new Date().toISOString() })
        .eq('id', userData.id)

      return new Response(
        JSON.stringify({ 
          user,
          session: authData.session 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (path === '/auth/register' && req.method === 'POST') {
      const registerData: RegisterRequest = await req.json()

      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: registerData.email,
        password: registerData.password,
        email_confirm: true,
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Insert user data
      const { error: userError } = await supabaseClient
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: registerData.email,
          password: 'hashed', // This will be handled by Supabase Auth
          dni: registerData.dni,
          nombres: registerData.nombres,
          apellidos: registerData.apellidos,
          telefono: registerData.telefono,
          genero: registerData.genero,
          fecha_nacimiento: registerData.fecha_nacimiento,
          rol: registerData.rol,
        })

      if (userError) {
        // Clean up auth user if usuario insert fails
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: userError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Insert role-specific data
      if (registerData.rol === 'estudiante') {
        const { error: studentError } = await supabaseClient
          .from('estudiantes')
          .insert({
            id: authData.user.id,
            codigo: registerData.codigo!,
            id_escuela: registerData.id_escuela!,
          })

        if (studentError) {
          // Clean up if student insert fails
          await supabaseClient.auth.admin.deleteUser(authData.user.id)
          return new Response(
            JSON.stringify({ error: studentError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } else if (registerData.rol === 'profesor') {
        const { error: professorError } = await supabaseClient
          .from('profesores')
          .insert({
            id: authData.user.id,
            codigo_profesor: registerData.codigo_profesor!,
            especialidad: registerData.especialidad,
            grado_academico: registerData.grado_academico,
          })

        if (professorError) {
          // Clean up if professor insert fails
          await supabaseClient.auth.admin.deleteUser(authData.user.id)
          return new Response(
            JSON.stringify({ error: professorError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'User registered successfully',
          user_id: authData.user.id 
        }),
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