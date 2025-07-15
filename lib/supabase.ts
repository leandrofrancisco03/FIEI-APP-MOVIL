import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types for our database
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          password: string
          dni: string
          nombres: string
          apellidos: string
          telefono: string | null
          genero: string | null
          fecha_nacimiento: string
          rol: 'estudiante' | 'profesor'
          fecha_registro: string
          ultima_conexion: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          dni: string
          nombres: string
          apellidos: string
          telefono?: string | null
          genero?: string | null
          fecha_nacimiento: string
          rol: 'estudiante' | 'profesor'
          fecha_registro?: string
          ultima_conexion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          dni?: string
          nombres?: string
          apellidos?: string
          telefono?: string | null
          genero?: string | null
          fecha_nacimiento?: string
          rol?: 'estudiante' | 'profesor'
          fecha_registro?: string
          ultima_conexion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      estudiantes: {
        Row: {
          id: string
          codigo: string
          id_escuela: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          codigo: string
          id_escuela: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          id_escuela?: number
          created_at?: string
          updated_at?: string
        }
      }
      profesores: {
        Row: {
          id: string
          codigo_profesor: string
          especialidad: string | null
          grado_academico: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          codigo_profesor: string
          especialidad?: string | null
          grado_academico?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo_profesor?: string
          especialidad?: string | null
          grado_academico?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escuelas: {
        Row: {
          id: number
          nombre: string
          facultad: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nombre: string
          facultad?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nombre?: string
          facultad?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cursos: {
        Row: {
          codigo: string
          nombre: string
          creditos: number
          horas_teoria: number
          horas_practica: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          codigo: string
          nombre: string
          creditos?: number
          horas_teoria?: number
          horas_practica?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          nombre?: string
          creditos?: number
          horas_teoria?: number
          horas_practica?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      curso_escuela: {
        Row: {
          id: number
          codigo_curso: string
          id_escuela: number
          ciclo: number
          created_at: string
        }
        Insert: {
          id?: number
          codigo_curso: string
          id_escuela: number
          ciclo?: number
          created_at?: string
        }
        Update: {
          id?: number
          codigo_curso?: string
          id_escuela?: number
          ciclo?: number
          created_at?: string
        }
      }
      secciones: {
        Row: {
          id: number
          nombre: string
          codigo_curso: string
          id_escuela: number
          id_profesor: string
          horario: string | null
          periodo_academico: string
          fecha_inicio: string | null
          fecha_fin: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nombre: string
          codigo_curso: string
          id_escuela: number
          id_profesor: string
          horario?: string | null
          periodo_academico: string
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nombre?: string
          codigo_curso?: string
          id_escuela?: number
          id_profesor?: string
          horario?: string | null
          periodo_academico?: string
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      matriculas: {
        Row: {
          id: number
          id_estudiante: string
          id_seccion: number
          fecha_matricula: string
          estado: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_estudiante: string
          id_seccion: number
          fecha_matricula?: string
          estado?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_estudiante?: string
          id_seccion?: number
          fecha_matricula?: string
          estado?: string
          created_at?: string
          updated_at?: string
        }
      }
      notas: {
        Row: {
          id: number
          id_matricula: number
          examen_parcial: number | null
          examen_final: number | null
          nota_tareas: number | null
          promedio_final: number | null
          observaciones: string | null
          fecha_registro: string
          fecha_actualizacion: string
          id_profesor_registro: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_matricula: number
          examen_parcial?: number | null
          examen_final?: number | null
          nota_tareas?: number | null
          promedio_final?: number | null
          observaciones?: string | null
          fecha_registro?: string
          fecha_actualizacion?: string
          id_profesor_registro: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_matricula?: number
          examen_parcial?: number | null
          examen_final?: number | null
          nota_tareas?: number | null
          promedio_final?: number | null
          observaciones?: string | null
          fecha_registro?: string
          fecha_actualizacion?: string
          id_profesor_registro?: string
          created_at?: string
          updated_at?: string
        }
      }
      asistencias: {
        Row: {
          id: number
          id_matricula: number
          fecha: string
          estado: 'Presente' | 'Tardanza' | 'Ausente'
          observacion: string | null
          id_profesor_registro: string
          fecha_registro: string
          created_at: string
        }
        Insert: {
          id?: number
          id_matricula: number
          fecha: string
          estado?: 'Presente' | 'Tardanza' | 'Ausente'
          observacion?: string | null
          id_profesor_registro: string
          fecha_registro?: string
          created_at?: string
        }
        Update: {
          id?: number
          id_matricula?: number
          fecha?: string
          estado?: 'Presente' | 'Tardanza' | 'Ausente'
          observacion?: string | null
          id_profesor_registro?: string
          fecha_registro?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}