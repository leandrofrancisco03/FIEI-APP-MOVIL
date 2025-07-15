export interface Usuario {
  id: string;
  email: string;
  password: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  genero?: string;
  fecha_nacimiento: string;
  rol: 'estudiante' | 'profesor';
  fecha_registro: string;
  ultima_conexion?: string;
  activo: boolean;
}

export interface Estudiante {
  id: string;
  codigo: string;
  id_escuela: number;
  usuario?: Usuario;
  escuela?: Escuela;
}

export interface Profesor {
  id: string;
  codigo_profesor: string;
  especialidad?: string;
  grado_academico?: string;
  usuario?: Usuario;
}

export interface Escuela {
  id: number;
  nombre: string;
  facultad?: string;
  activo: boolean;
}

export interface Curso {
  codigo: string;
  nombre: string;
  creditos: number;
  horas_teoria: number;
  horas_practica: number;
  activo: boolean;
}

export interface CursoEscuela {
  id: number;
  codigo_curso: string;
  id_escuela: number;
  ciclo: number;
  curso?: Curso;
  escuela?: Escuela;
}

export interface Seccion {
  id: number;
  nombre: string;
  codigo_curso: string;
  id_escuela: number;
  id_profesor: string;
  horario?: string;
  periodo_academico: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  curso?: Curso;
  escuela?: Escuela;
  profesor?: Profesor;
}

export interface Matricula {
  id: number;
  id_estudiante: string;
  id_seccion: number;
  fecha_matricula: string;
  estado: string;
  estudiante?: Estudiante;
  seccion?: Seccion;
}

export interface Nota {
  id: number;
  id_matricula: number;
  examen_parcial?: number;
  examen_final?: number;
  nota_tareas?: number;
  promedio_final?: number;
  observaciones?: string;
  fecha_registro: string;
  fecha_actualizacion: string;
  id_profesor_registro: string;
  matricula?: Matricula;
}

export interface Asistencia {
  id: number;
  id_matricula: number;
  fecha: string;
  estado: 'Presente' | 'Tardanza' | 'Ausente';
  observacion?: string;
  id_profesor_registro: string;
  fecha_registro: string;
  matricula?: Matricula;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: 'estudiante' | 'profesor';
  codigo?: string;
  codigo_profesor?: string;
  id_escuela?: number;
}