import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { User, Mail, Hash, GraduationCap, LogOut } from 'lucide-react-native';

export default function Perfil() {
  const { user, logout } = useAuth();
  const router = useRouter();

const handleLogout = () => {
  console.log('=== HANDLE LOGOUT CALLED ===');
  
  if (Platform.OS === 'web') {
    // Para web, usar confirm del navegador
    const shouldLogout = window.confirm('¿Estás seguro que deseas cerrar sesión?');
    if (shouldLogout) {
      performLogout();
    }
  } else {
    // Para móvil, usar Alert nativo
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: performLogout
        }
      ]
    );
  }
};

const performLogout = async () => {
  console.log('=== USER CONFIRMED LOGOUT ===');
  try {
    console.log('Iniciando logout...');
    await logout();
    console.log('Logout exitoso, navegando...');
    router.replace('/login');
  } catch (error) {
    console.error('Error during logout:', error);
    if (Platform.OS === 'web') {
      alert('Error: No se pudo cerrar la sesión correctamente');
    } else {
      Alert.alert('Error', 'No se pudo cerrar la sesión correctamente');
    }
  }
};

  if (!user) return null;

  const isStudent = user.rol === 'estudiante';

  const getEscuelaName = (id?: number): string => {
    if (!id) return 'No especificada';
    
    const escuelas = {
      1: 'Ingeniería Electrónica',
      2: 'Ingeniería Informática', 
      3: 'Ingeniería en Telecomunicaciones',
      4: 'Ingeniería Mecatrónica'
    };
    return escuelas[id as keyof typeof escuelas] || 'No especificada';
  };

  console.log('User data in profile:', user); // Debug log

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>Información personal y académica</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>
            {user.nombres} {user.apellidos}
          </Text>
          <Text style={styles.userRole}>
            {isStudent ? 'Estudiante' : 'Profesor'}
          </Text>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <View style={styles.infoItem}>
          <Mail size={20} color="#A0522D" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Hash size={20} color="#A0522D" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {isStudent ? 'Código de Estudiante' : 'Código de Profesor'}
            </Text>
            <Text style={styles.infoValue}>
              {isStudent ? (user.codigo || 'No asignado') : (user.codigo_profesor || 'No asignado')}
            </Text>
          </View>
        </View>

        {isStudent && (
          <View style={styles.infoItem}>
            <GraduationCap size={20} color="#A0522D" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Escuela</Text>
              <Text style={styles.infoValue}>
                {getEscuelaName(user.id_escuela)}
              </Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.universityCard}>
        <Text style={styles.sectionTitle}>Universidad</Text>
        <Text style={styles.universityName}>
          Universidad Nacional Federico Villarreal
        </Text>
        <Text style={styles.facultyName}>
          Facultad de Ingeniería Electrónica e Informática
        </Text>
        <Text style={styles.systemName}>
          Sistema Académico Móvil
        </Text>
      </Card>

      <View style={styles.actionSection}>
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
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
  profileCard: {
    margin: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D2691E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    color: '#A0522D',
    textTransform: 'capitalize',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5DEB3',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#A0522D',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B4513',
  },
  universityCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  universityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D2691E',
    textAlign: 'center',
    marginBottom: 8,
  },
  facultyName: {
    fontSize: 16,
    color: '#A0522D',
    textAlign: 'center',
    marginBottom: 4,
  },
  systemName: {
    fontSize: 14,
    color: '#CD853F',
    textAlign: 'center',
  },
  actionSection: {
    padding: 20,
    paddingTop: 0,
  },
  logoutButton: {
    marginTop: 20,
  },
});