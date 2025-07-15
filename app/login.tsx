import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const { login, resendVerification, isLoading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!email.includes('@')) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    const success = await login(email, password);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Error de Inicio de Sesión',
        'Credenciales incorrectas o email no verificado. Si no has verificado tu email, revisa tu bandeja de entrada.',
        [
          {
            text: 'Reenviar Verificación',
            onPress: async () => {
              const sent = await resendVerification(email);
              if (sent) {
                Alert.alert('Correo Enviado', 'Se ha enviado un nuevo correo de verificación.');
              } else {
                Alert.alert('Error', 'No se pudo enviar el correo de verificación.');
              }
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>UNFV</Text>
          <Text style={styles.subtitle}>Facultad de Ingeniería Electrónica e Informática</Text>
          <Text style={styles.description}>
            Sistema Académico para Estudiantes y Profesores
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ejemplo@unfv.edu.pe"
            type="email"
            error={errors.email}
            autoCapitalize="none"
          />
          
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu contraseña"
            type="password"
            error={errors.password}
          />
          
          <Button
            title="Ingresar"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />
          
          <Button
            title="¿No tienes cuenta? Regístrate"
            onPress={() => router.push('/registro')}
            variant="secondary"
            style={styles.registerButton}
          />
          
          <View style={styles.verificationInfo}>
            <Text style={styles.verificationTitle}>Importante:</Text>
            <Text style={styles.verificationText}>
              Después del registro, debes verificar tu correo electrónico antes de poder iniciar sesión.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEDEBB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D2691E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#8B4513',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#A0522D',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#D2691E',
  },
  registerButton: {
    marginTop: 12,
  },
  verificationInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#E6F3FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 16,
  },
});