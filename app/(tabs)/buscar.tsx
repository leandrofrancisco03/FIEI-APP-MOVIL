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
import { SearchBar } from '@/components/SearchBar';
import { SemesterPicker } from '@/components/SemesterPicker';
import { BookOpen, Search, Award } from 'lucide-react-native';

export default function Buscar() {
  const { user } = useAuth();
  const { 
    searchCourses, 
    getStudentGrades, 
    getSemesters,
    isLoading
  } = useSupabaseData();
  
  // Protección: Solo estudiantes pueden acceder a esta página
  if (!user || user.rol !== 'estudiante') {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
        <Text style={styles.accessDeniedText}>
          Esta sección está disponible únicamente para estudiantes.
        </Text>
      </View>
    );
  }
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('2025-1');
  const [searchResults, setSearchResults] = useState([]);
  const [grades, setGrades] = useState([]);
  const semesters = getSemesters();
  
  React.useEffect(() => {
    if (user) {
      loadGrades();
    }
  }, [user, selectedSemester]);

  React.useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadGrades = async () => {
    if (!user || user.rol !== 'estudiante') return;

    try {
      const gradesData = await getStudentGrades(user.id, selectedSemester);
      setGrades(gradesData);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const performSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    try {
      const results = await searchCourses(searchQuery, user.id_escuela || 0);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching courses:', error);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Cursos</Text>
        <Text style={styles.subtitle}>Explora el catálogo de cursos y consulta tus notas</Text>
      </View>
      <Card style={styles.searchCard}>
        <View style={styles.searchHeader}>
          <Search size={24} color="#8B4513" />
          <Text style={styles.searchTitle}>Buscar Cursos</Text>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre o código del curso..."
        />
        {isLoading && searchQuery.trim() && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D2691E" />
            <Text style={styles.loadingText}>Buscando cursos...</Text>
          </View>
        )}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Resultados de Búsqueda</Text>
            {searchResults.map((course, index) => (
              <Card key={index} style={styles.courseResult}>
                <View style={styles.courseHeader}>
                  <BookOpen size={20} color="#D2691E" />
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.nombre}</Text>
                    <Text style={styles.courseCode}>Código: {course.codigo}</Text>
                    <Text style={styles.courseDetails}>
                      {course.creditos} créditos • {course.horas_teoria}h teoría • {course.horas_practica}h práctica
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
        {searchQuery.trim() && searchResults.length === 0 && !isLoading && (
          <Text style={styles.noResults}>
            No se encontraron cursos que coincidan con tu búsqueda
          </Text>
        )}
      </Card>
      <Card style={styles.semesterCard}>
        <Text style={styles.sectionTitle}>Mis Notas por Semestre</Text>
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
          Mis Calificaciones - Semestre {selectedSemester}
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
                <Text style={styles.gradeCourseName}>
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
  searchCard: {
    margin: 20,
    marginBottom: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#A0522D',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 12,
  },
  courseResult: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DEB887',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  courseDetails: {
    fontSize: 12,
    color: '#CD853F',
  },
  noResults: {
    textAlign: 'center',
    color: '#A0522D',
    fontStyle: 'italic',
    padding: 16,
  },
  semesterCard: {
    margin: 20,
    marginTop: 10,
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
  gradeCourseName: {
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
  emptyText: {
    textAlign: 'center',
    color: '#A0522D',
    fontStyle: 'italic',
    padding: 20,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEDEBB',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 16,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#A0522D',
    textAlign: 'center',
    lineHeight: 24,
  },
});