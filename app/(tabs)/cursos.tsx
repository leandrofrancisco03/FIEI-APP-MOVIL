import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Card } from '@/components/Card';
import { SemesterPicker } from '@/components/SemesterPicker';
import { BookOpen, Award } from 'lucide-react-native';

export default function Cursos() {
  const { user } = useAuth();
  const { 
    getUserCourses, 
    getStudentGrades, 
    getSemesters,
    isLoading
  } = useSupabaseData();
  
  const [selectedSemester, setSelectedSemester] = useState('2025-1');
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const semesters = getSemesters();
  
  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedSemester]);

  const loadData = async () => {
    if (!user || user.rol !== 'estudiante') return;

    try {
      const coursesData = await getUserCourses(user.id, selectedSemester);
      setCourses(coursesData);

      const gradesData = await getStudentGrades(user.id, selectedSemester);
      setGrades(gradesData);
    } catch (error) {
      console.error('Error loading courses data:', error);
    }
  };

  if (!user || user.rol !== 'estudiante') return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Cursos</Text>
        <Text style={styles.subtitle}>Gestiona tus cursos académicos</Text>
      </View>

      <Card style={styles.semesterCard}>
        <Text style={styles.sectionTitle}>Seleccionar Semestre</Text>
        <SemesterPicker
          value={selectedSemester}
          onValueChange={setSelectedSemester}
          semesters={semesters}
        />
      </Card>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D2691E" />
          <Text style={styles.loadingText}>Cargando cursos...</Text>
        </View>
      )}

      <View style={styles.coursesSection}>
        <Text style={styles.sectionTitle}>
          Cursos del Semestre {selectedSemester}
        </Text>
        
        {courses.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando cursos...' : 'No tienes cursos matriculados en este semestre'}
            </Text>
          </Card>
        ) : (
          courses.map((course) => {
            const grade = grades.find(g => g.codigo_curso === course.codigo_curso);
            
            return (
              <Card key={course.id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <BookOpen size={24} color="#8B4513" />
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.cursos?.nombre || course.nombre}</Text>
                    <Text style={styles.courseCode}>
                      Código: {course.cursos?.codigo || course.codigo_curso}
                    </Text>
                    <Text style={styles.sectionInfo}>
                      Sección {course.nombre} • {course.cursos?.creditos || 3} créditos
                    </Text>
                    <Text style={styles.professorInfo}>
                      Prof. {course.profesores?.usuarios?.nombres} {course.profesores?.usuarios?.apellidos}
                    </Text>
                    <Text style={styles.scheduleInfo}>
                      {course.horario || 'Horario por definir'}
                    </Text>
                  </View>
                </View>
                
                {grade && (
                  <View style={styles.gradeSection}>
                    <View style={styles.gradeSectionHeader}>
                      <Award size={18} color="#D2691E" />
                      <Text style={styles.gradeSectionTitle}>Calificaciones</Text>
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
                  </View>
                )}
              </Card>
            );
          })
        )}
      </View>
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
    marginLeft: 16,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 14,
    color: '#A0522D',
    marginBottom: 4,
  },
  sectionInfo: {
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
  gradeSection: {
    borderTopWidth: 1,
    borderTopColor: '#DEB887',
    paddingTop: 16,
  },
  gradeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D2691E',
    marginLeft: 8,
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