import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { SemesterPicker } from '@/components/SemesterPicker';
import { ClipboardCheck, Search, GraduationCap, Award } from 'lucide-react-native';

interface GradeForm {
  semestre: string;
  codigo_curso: string;
  codigo_estudiante: string;
  tipo_nota: 'parcial' | 'final' | 'tareas';
  nota: string;
  observaciones: string;
}

export default function Notas() {
  const { user } = useAuth();
  const { 
    getProfessorCourses, 
    getSemesters,
    searchStudentByCode,
    insertGrade,
    getStudentGrades,
    isLoading
  } = useSupabaseData();
  
  const [form, setForm] = useState<GradeForm>({
    semestre: '',
    codigo_curso: '',
    codigo_estudiante: '',
    tipo_nota: 'parcial',
    nota: '',
    observaciones: ''
  });
  
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [grades, setGrades] = useState([]);
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
        const gradesData = await getStudentGrades(user.id, selectedSemester);
        setGrades(gradesData);
      } else if (user.rol === 'profesor') {
        const coursesData = await getProfessorCourses(user.id, form.semestre);
        setProfessorCourses(coursesData);
      }
    } catch (error) {
      console.error('Error loading grades data:', error);
    }
  };

  if (!user) return null;

  const isStudent = user.rol === 'estudiante';
  const isProfesor = user.rol === 'profesor';

  // Para estudiantes: mostrar sus notas
  if (isStudent) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Notas</Text>
          <Text style={styles.subtitle}>Consulta tus calificaciones académicas</Text>
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
            <Text style={styles.loadingText}>Cargando notas...</Text>
          </View>
        )}

        <View style={styles.gradesSection}>
          <Text style={styles.sectionTitle}>
            Calificaciones - Semestre {selectedSemester}
          </Text>
          
          {grades.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>
                {isLoading ? 'Cargando calificaciones...' : 'No tienes calificaciones registradas en este semestre'}
              </Text>
            </Card>
          ) : (
            grades.map((grade, index) => (
              <Card key={index} style={styles.gradeCard}>
                <View style={styles.gradeHeader}>
                  <Award size={20} color="#D2691E" />
                  <Text style={styles.courseName}>
                    Curso: {grade.codigo_curso}
                  </Text>
                </View>
                
                <View style={styles.gradeGrid}>
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>Examen Parcial (30%)</Text>
                    <Text style={styles.gradeValue}>
                      {grade.examen_parcial ? grade.examen_parcial.toFixed(1) : 'Pendiente'}
                    </Text>
                  </View>
                  
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>Examen Final (30%)</Text>
                    <Text style={styles.gradeValue}>
                      {grade.examen_final ? grade.examen_final.toFixed(1) : 'Pendiente'}
                    </Text>
                  </View>
                  
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>Nota de Tareas (40%)</Text>
                    <Text style={styles.gradeValue}>
                      {grade.nota_tareas ? grade.nota_tareas.toFixed(1) : 'Pendiente'}
                    </Text>
                  </View>
                  
                  <View style={styles.gradeItem}>
                    <Text style={styles.gradeLabel}>Promedio Final</Text>
                    <Text style={[
                      styles.gradeValue,
                      styles.finalGrade,
                      { 
                        color: grade.promedio_final && grade.promedio_final >= 11 
                          ? '#228B22' 
                          : '#DC143C' 
                      }
                    ]}>
                      {grade.promedio_final ? grade.promedio_final.toFixed(1) : 'Calculando...'}
                    </Text>
                  </View>
                </View>
                
                {grade.observaciones && (
                  <View style={styles.observationsContainer}>
                    <Text style={styles.observationsTitle}>Observaciones:</Text>
                    <Text style={styles.observationsText}>{grade.observaciones}</Text>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  // Para profesores: formulario para registrar notas
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
    if (!form.codigo_estudiante.trim()) {
      setStudentInfo(null);
      return;
    }
    
    try {
      const student = await searchStudentByCode(form.codigo_estudiante);
      if (student) {
        setStudentInfo(student);
      } else {
        setStudentInfo(null);
        Alert.alert('Error', 'No se encontró un estudiante con ese código');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setStudentInfo(null);
      Alert.alert('Error', 'Error al buscar el estudiante');
    }
  };

  const handleSubmit = async () => {
    if (!form.codigo_curso || !form.codigo_estudiante || !form.nota) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const nota = parseFloat(form.nota);
    if (isNaN(nota) || nota < 0 || nota > 20) {
      Alert.alert('Error', 'La nota debe ser un número entre 0 y 20');
      return;
    }

    if (!studentInfo) {
      Alert.alert('Error', 'Busca y verifica el estudiante antes de continuar');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await insertGrade({
        codigo_curso: form.codigo_curso,
        codigo_estudiante: form.codigo_estudiante,
        tipo_nota: form.tipo_nota,
        nota: nota,
        observaciones: form.observaciones,
        id_profesor: user.id
      });

      if (success) {
        Alert.alert('Éxito', 'Nota registrada correctamente');
        setForm({
          semestre: form.semestre,
          codigo_curso: '',
          codigo_estudiante: '',
          tipo_nota: 'parcial',
          nota: '',
          observaciones: ''
        });
        setStudentInfo(null);
      } else {
        Alert.alert('Error', 'No se pudo registrar la nota');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al registrar la nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Notas</Text>
        <Text style={styles.subtitle}>Ingresa las calificaciones de tus estudiantes</Text>
        <Text style={styles.formula}>Fórmula: 30% Parcial + 30% Final + 40% Tareas</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <ClipboardCheck size={24} color="#8B4513" />
          <Text style={styles.formTitle}>Nueva Calificación</Text>
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

        <Text style={styles.sectionTitle}>Tipo de Nota</Text>
        <View style={styles.gradeTypeContainer}>
          {[
            { value: 'parcial', label: 'Examen Parcial (30%)', color: '#D2691E' },
            { value: 'final', label: 'Examen Final (30%)', color: '#CD853F' },
            { value: 'tareas', label: 'Nota de Tareas (40%)', color: '#8B4513' }
          ].map((type) => (
            <Card 
              key={type.value}
              style={[
                styles.gradeTypeOption,
                form.tipo_nota === type.value && styles.gradeTypeOptionSelected,
                { borderColor: form.tipo_nota === type.value ? type.color : '#DEB887' }
              ]}
            >
              <Text 
                style={[
                  styles.gradeTypeText,
                  { color: form.tipo_nota === type.value ? type.color : '#8B4513' }
                ]}
                onPress={() => setForm({...form, tipo_nota: type.value as any})}
              >
                {type.label}
              </Text>
            </Card>
          ))}
        </View>

        <Input
          label="Nota (0-20)"
          value={form.nota}
          onChangeText={(text) => setForm({...form, nota: text})}
          placeholder="Ej: 15.5"
          keyboardType="numeric"
        />

        <Input
          label="Observaciones (Opcional)"
          value={form.observaciones}
          onChangeText={(text) => setForm({...form, observaciones: text})}
          placeholder="Comentarios adicionales..."
          multiline
          numberOfLines={3}
        />

        <Button
          title="Registrar Nota"
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
    marginBottom: 8,
  },
  formula: {
    fontSize: 14,
    color: '#F5DEB3',
    fontStyle: 'italic',
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
  gradesSection: {
    padding: 20,
    paddingTop: 10,
  },
  gradeCard: {
    marginBottom: 16,
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 12,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gradeItem: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEB887',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#A0522D',
    marginBottom: 4,
    fontWeight: '500',
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  finalGrade: {
    fontSize: 18,
  },
  observationsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0E68C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DAA520',
  },
  observationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
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
  gradeTypeContainer: {
    marginBottom: 16,
  },
  gradeTypeOption: {
    marginBottom: 8,
    borderWidth: 2,
    padding: 12,
  },
  gradeTypeOptionSelected: {
    backgroundColor: '#FFF8DC',
  },
  gradeTypeText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
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