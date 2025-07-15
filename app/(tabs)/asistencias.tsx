import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { SemesterPicker } from '@/components/SemesterPicker';
import { Users, Calendar, GraduationCap, CircleCheck as CheckCircle, Circle as XCircle, Clock } from 'lucide-react-native';

interface AttendanceForm {
  semestre: string;
  codigo_curso: string;
  codigo_estudiante: string;
  fecha: string;
  estado: 'Presente' | 'Tardanza' | 'Ausente';
  observacion: string;
}

export default function Asistencias() {
  const { user } = useAuth();
  const { 
    getProfessorCourses, 
    getSemesters,
    searchStudentByCode,
    registerAttendance,
    getUserCourses,
    isLoading
  } = useSupabaseData();
  
  const [form, setForm] = useState<AttendanceForm>({
    semestre: '',
    codigo_curso: '',
    codigo_estudiante: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Presente',
    observacion: ''
  });
  
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [professorCourses, setProfessorCourses] = useState([]);
  const semesters = getSemesters();
  
  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedSemester]);

  const loadData = async () => {
    if (!user) return;

    try {
      if (user.rol === 'estudiante') {
        const coursesData = await getUserCourses(user.id, selectedSemester);
        setCourses(coursesData);
      } else if (user.rol === 'profesor') {
        const coursesData = await getProfessorCourses(user.id, form.semestre);
        setProfessorCourses(coursesData);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  if (!user) return null;

  const isStudent = user.rol === 'estudiante';
  const isProfesor = user.rol === 'profesor';

  // Para estudiantes: mostrar información de asistencias
  if (isStudent) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Asistencias</Text>
          <Text style={styles.subtitle}>Consulta tu registro de asistencias</Text>
        </View>

        <Card style={styles.semesterCard}>
          <Text style={styles.sectionTitle}>Semestre Académico</Text>
          <SemesterPicker
            value={selectedSemester}
            onValueChange={setSelectedSemester}
            semesters={semesters}
          />
        </Card>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D2691E" />
            <Text style={styles.loadingText}>Cargando asistencias...</Text>
          </View>
        )}

        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>
            Cursos - Semestre {selectedSemester}
          </Text>
          
          {courses.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                {isLoading ? 'Cargando cursos...' : 'No tienes cursos matriculados en este semestre'}
              </Text>
            </Card>
          ) : (
            courses.map((course) => (
              <Card key={course.id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <Calendar size={20} color="#8B4513" />
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.cursos?.nombre || course.nombre}</Text>
                    <Text style={styles.courseCode}>
                      Código: {course.cursos?.codigo || course.codigo_curso} - Sección {course.nombre}
                    </Text>
                    <Text style={styles.professorInfo}>
                      Prof. {course.profesores?.usuarios?.nombres} {course.profesores?.usuarios?.apellidos}
                    </Text>
                    <Text style={styles.scheduleInfo}>
                      {course.horario || 'Horario por definir'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendanceTitle}>Estado de Asistencias</Text>
                  <Text style={styles.attendanceNote}>
                    Las asistencias son registradas por el profesor durante cada clase.
                    Consulta regularmente para estar al tanto de tu registro.
                  </Text>
                  
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <CheckCircle size={16} color="#228B22" />
                      <Text style={styles.legendText}>Presente</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <Clock size={16} color="#DAA520" />
                      <Text style={styles.legendText}>Tardanza</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <XCircle size={16} color="#DC143C" />
                      <Text style={styles.legendText}>Ausente</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  // Para profesores: formulario para registrar asistencias
  React.useEffect(() => {
    if (user?.rol === 'profesor') {
      loadProfessorCourses();
    }
  }, [form.semestre]);

  const loadProfessorCourses = async () => {
    if (!user) return;
    try {
      const coursesData = await getProfessorCourses(user.id, form.semestre);
      setProfessorCourses(coursesData);
    } catch (error) {
      console.error('Error loading professor courses:', error);
    }
  };

  const searchStudent = async () => {
  console.log('=== SEARCH STUDENT CALLED ==='); // Debug log
  console.log('codigo_estudiante:', form.codigo_estudiante);
  
  if (!form.codigo_estudiante.trim()) {
    setStudentInfo(null);
    return;
  }
  
  try {
    const student = await searchStudentByCode(form.codigo_estudiante);
  console.log('Search result:', student);
  
  if (student) {
    setStudentInfo(student);
  } else {
    setStudentInfo(null);
    
    if (Platform.OS === 'web') {
      window.alert('Error: No se encontró un estudiante con ese código');
    } else {
      Alert.alert('Error', 'No se encontró un estudiante con ese código');
    }
  }
  } catch (error) {
    console.error('Error searching student:', error);
    setStudentInfo(null);
    
    if (Platform.OS === 'web') {
      window.alert('Error: Error al buscar el estudiante');
    } else {
      Alert.alert('Error', 'Error al buscar el estudiante');
    }
  }
};

const handleSubmit = async () => {
  console.log('=== HANDLE SUBMIT CALLED ==='); // Debug log
  console.log('Form data:', form); // Debug log
  console.log('Student info:', studentInfo); // Debug log

  // Validaciones con logs para debug
  if (!form.codigo_curso || !form.codigo_estudiante || !form.fecha) {
    console.log('Validation failed: missing fields');
    console.log('codigo_curso:', form.codigo_curso);
    console.log('codigo_estudiante:', form.codigo_estudiante);
    console.log('fecha:', form.fecha);
    
    if (Platform.OS === 'web') {
      window.alert('Error: Por favor completa todos los campos obligatorios');
    } else {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
    }
    return;
  }

  console.log('Starting attendance registration...');
  setIsSubmitting(true);
  
  try {
    const attendanceData = {
      codigo_curso: form.codigo_curso,
      codigo_estudiante: form.codigo_estudiante,
      fecha: form.fecha,
      estado: form.estado,
      observacion: form.observacion,
      id_profesor: user.id
    };
    
    console.log('Calling registerAttendance with:', attendanceData);
    
    const success = await registerAttendance(attendanceData);
    
    console.log('registerAttendance result:', success);

    if (success) {
      if (Platform.OS === 'web') {
        window.alert('Éxito: Asistencia registrada correctamente');
      } else {
        Alert.alert('Éxito', 'Asistencia registrada correctamente');
      }
      
      // Reset form
      setForm({
        semestre: form.semestre,
        codigo_curso: form.codigo_curso,
        codigo_estudiante: '',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'Presente',
        observacion: ''
      });
      setStudentInfo(null);
    } else {
      if (Platform.OS === 'web') {
        window.alert('Error: No se pudo registrar la asistencia');
      } else {
        Alert.alert('Error', 'No se pudo registrar la asistencia');
      }
    }
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    
    if (Platform.OS === 'web') {
      window.alert('Error: Ocurrió un error al registrar la asistencia');
    } else {
      Alert.alert('Error', 'Ocurrió un error al registrar la asistencia');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Presente':
        return <CheckCircle size={20} color="#228B22" />;
      case 'Tardanza':
        return <Clock size={20} color="#DAA520" />;
      case 'Ausente':
        return <XCircle size={20} color="#DC143C" />;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Asistencias</Text>
        <Text style={styles.subtitle}>Controla la asistencia de tus estudiantes</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <Users size={24} color="#8B4513" />
          <Text style={styles.formTitle}>Nueva Asistencia</Text>
        </View>

        <Text style={styles.sectionTitle}>Semestre Académico</Text>
        <SemesterPicker
          value={form.semestre}
          onValueChange={(value) => setForm({...form, semestre: value})}
          semesters={semesters}
        />

        <Text style={styles.sectionTitle}>Curso</Text>
        <View style={styles.coursesContainer}>
          {professorCourses.length === 0 ? (
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando cursos...' : 'No tienes cursos asignados en este semestre'}
            </Text>
          ) : (
            professorCourses.map((course) => (
              <Card 
                key={course.id}
                style={[
                  styles.courseOption,
                  form.codigo_curso === course.cursos?.codigo && styles.courseOptionSelected
                ]}
              >
                <Text 
                  style={[
                    styles.courseOptionText,
                    form.codigo_curso === course.cursos?.codigo && styles.courseOptionTextSelected
                  ]}
                  onPress={() => setForm({...form, codigo_curso: course.cursos?.codigo || ''})}
                >
                  {course.cursos?.nombre}
                </Text>
                <Text style={styles.courseOptionCode}>
                  {course.cursos?.codigo} - Sección {course.nombre}
                </Text>
              </Card>
            ))
          )}
        </View>

        <Input
          label="Código del Estudiante"
          value={form.codigo_estudiante}
          onChangeText={(text) => setForm({...form, codigo_estudiante: text})}
          placeholder="Ej: E2021001"
          onEndEditing={searchStudent}
        />

        {studentInfo && (
          <Card style={styles.studentInfo}>
            <View style={styles.studentHeader}>
              <GraduationCap size={20} color="#228B22" />
              <Text style={styles.studentTitle}>Estudiante Encontrado</Text>
            </View>
            <Text style={styles.studentName}>
              {studentInfo.usuarios?.nombres} {studentInfo.usuarios?.apellidos}
            </Text>
            <Text style={styles.studentDetails}>
              Código: {studentInfo.codigo} • Escuela: {studentInfo.escuelas?.nombre}
            </Text>
          </Card>
        )}

        <Input
          label="Fecha"
          value={form.fecha}
          onChangeText={(text) => setForm({...form, fecha: text})}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.sectionTitle}>Estado de Asistencia</Text>
        <View style={styles.statusContainer}>
          {[
            { value: 'Presente', label: 'Presente', color: '#228B22' },
            { value: 'Tardanza', label: 'Tardanza', color: '#DAA520' },
            { value: 'Ausente', label: 'Ausente', color: '#DC143C' }
          ].map((status) => (
            <Card 
              key={status.value}
              style={[
                styles.statusOption,
                form.estado === status.value && styles.statusOptionSelected,
                { borderColor: form.estado === status.value ? status.color : '#DEB887' }
              ]}
            >
              <View style={styles.statusContent}>
                {getStatusIcon(status.value)}
                <Text 
                  style={[
                    styles.statusText,
                    { color: form.estado === status.value ? status.color : '#8B4513' }
                  ]}
                  onPress={() => setForm({...form, estado: status.value as any})}
                >
                  {status.label}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        <Input
          label="Observaciones (Opcional)"
          value={form.observacion}
          onChangeText={(text) => setForm({...form, observacion: text})}
          placeholder="Comentarios adicionales..."
          multiline
          numberOfLines={3}
        />

        <Button
          title="Registrar Asistencia"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEDEBB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#D2691E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF8DC',
  },
  semesterCard: {
    margin: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 12,
  },
  coursesSection: {
    padding: 20,
    paddingTop: 10,
  },
  courseCard: {
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#A0522D',
    marginBottom: 4,
  },
  professorInfo: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleInfo: {
    fontSize: 12,
    color: '#CD853F',
  },
  attendanceInfo: {
    borderTopWidth: 1,
    borderTopColor: '#DEB887',
    paddingTop: 16,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D2691E',
    marginBottom: 8,
  },
  attendanceNote: {
    fontSize: 14,
    color: '#A0522D',
    lineHeight: 20,
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#8B4513',
    marginLeft: 4,
  },
  formCard: {
    margin: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 12,
  },
  coursesContainer: {
    marginBottom: 16,
  },
  courseOption: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DEB887',
  },
  courseOptionSelected: {
    borderColor: '#D2691E',
    backgroundColor: '#FFF8DC',
  },
  courseOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B4513',
    marginBottom: 4,
  },
  courseOptionTextSelected: {
    color: '#D2691E',
  },
  courseOptionCode: {
    fontSize: 14,
    color: '#A0522D',
  },
  studentInfo: {
    backgroundColor: '#F0FFF0',
    borderWidth: 1,
    borderColor: '#90EE90',
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#228B22',
    marginLeft: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#006400',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#228B22',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusOption: {
    marginBottom: 8,
    borderWidth: 2,
    padding: 12,
  },
  statusOptionSelected: {
    backgroundColor: '#FFF8DC',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#D2691E',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A0522D',
    fontStyle: 'italic',
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#A0522D',
  },
});