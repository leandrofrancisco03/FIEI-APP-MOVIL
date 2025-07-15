import React, { useState, useEffect } from 'react';
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
import { GraduationCap, BookOpen, Award, TrendingUp } from 'lucide-react-native';

export default function Home() {
  const { user } = useAuth();
  const { 
    getUserCourses, 
    getStudentGrades, 
    getProfessorCourses, 
    getSemesters,
    isLoading
  } = useSupabaseData();
  
  const [selectedSemester, setSelectedSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const semesters = getSemesters();
  
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedSemester]);

  const loadData = async () => {
    if (!user) return;

    console.log('Loading data for user:', user.id, 'semester:', selectedSemester);
    console.log('User role:', user.rol);
    
    const isStudent = user.rol === 'estudiante';
    
    try {
      const coursesData = isStudent 
        ? await getUserCourses(user.id, selectedSemester)
        : await getProfessorCourses(user.id, selectedSemester);
      
      console.log('Loaded courses:', coursesData);
      setCourses(coursesData);

      if (isStudent) {
        const gradesData = await getStudentGrades(user.id, selectedSemester);
        console.log('Loaded grades:', gradesData);
        setGrades(gradesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  if (!user) return null;

  const isStudent = user.rol === 'estudiante';

  const calculateAverage = () => {
    if (!isStudent || grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + (grade.promedio_final || 0), 0);
    return (total / grades.length).toFixed(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {user.nombres}!</Text>
        <Text style={styles.subtitle}>
          {isStudent ? 'Estudiante' : 'Profesor'} - Facultad de Ingeniería
        </Text>
        {isStudent && (
          <Text style={styles.code}>Código: {user.codigo}</Text>
        )}
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
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      )}

      {isStudent && (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <GraduationCap size={24} color="#8B4513" />
            <Text style={styles.statNumber}>{courses.length}</Text>
            <Text style={styles.statLabel}>Cursos</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Award size={24} color="#D2691E" />
            <Text style={styles.statNumber}>{calculateAverage()}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <TrendingUp size={24} color="#CD853F" />
            <Text style={styles.statNumber}>
              {grades.filter(g => (g.promedio_final || 0) >= 11).length}
            </Text>
            <Text style={styles.statLabel}>Aprobados</Text>
          </Card>
        </View>
      )}

      <View style={styles.coursesSection}>
        <Text style={styles.sectionTitle}>
          {isStudent ? 'Mis Cursos' : 'Cursos que Enseño'}
        </Text>
        
        {courses.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando cursos...' : 'No hay cursos para el semestre seleccionado'}
            </Text>
          </Card>
        ) : (
          courses.map((course) => {
            const grade = isStudent ? grades.find(g => g.codigo_curso === course.codigo_curso) : null;
            
            return (
              <Card key={course.id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <BookOpen size={20} color="#8B4513" />
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.curso?.nombre}</Text>
                    <Text style={styles.courseCode}>
                      {course.curso?.codigo} - Sección {course.nombre}
                    </Text>
                    <Text style={styles.courseDetails}>
                      {course.curso?.creditos} créditos • {course.horario || 'Horario por definir'}
                    </Text>
                  </View>
                </View>
                
                {isStudent && grade && (
                  <View style={styles.gradeContainer}>
                    <View style={styles.gradeItem}>
                      <Text style={styles.gradeLabel}>Parcial (30%)</Text>
                      <Text style={styles.gradeValue}>
                        {grade.examen_parcial || '-'}
                      </Text>
                    </View>
                    <View style={styles.gradeItem}>
                      <Text style={styles.gradeLabel}>Final (30%)</Text>
                      <Text style={styles.gradeValue}>
                        {grade.examen_final || '-'}
                      </Text>
                    </View>
                    <View style={styles.gradeItem}>
                      <Text style={styles.gradeLabel}>Tareas (40%)</Text>
                      <Text style={styles.gradeValue}>
                        {grade.nota_tareas || '-'}
                      </Text>
                    </View>
                    <View style={styles.gradeItem}>
                      <Text style={styles.gradeLabel}>Promedio</Text>
                      <Text style={[styles.gradeValue, styles.finalGrade]}>
                        {grade.promedio_final || '-'}
                      </Text>
                    </View>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF8DC',
    marginBottom: 4,
  },
  code: {
    fontSize: 14,
    color: '#F5DEB3',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0522D',
    textAlign: 'center',
  },
  coursesSection: {
    padding: 20,
    paddingTop: 10,
  },
  courseCard: {
    marginBottom: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginBottom: 2,
  },
  courseDetails: {
    fontSize: 12,
    color: '#CD853F',
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DEB887',
  },
  gradeItem: {
    alignItems: 'center',
    flex: 1,
  },
  gradeLabel: {
    fontSize: 10,
    color: '#A0522D',
    marginBottom: 4,
    textAlign: 'center',
  },
  gradeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  finalGrade: {
    fontSize: 16,
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