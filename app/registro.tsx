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
import { SchoolPicker } from '@/components/SchoolPicker';
import { DatePicker } from '@/components/DatePicker';

interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  genero: string;
  fecha_nacimiento: string;
  rol: 'estudiante' | 'profesor';
  codigo?: string;
  codigo_profesor?: string;
  id_escuela?: number;
  especialidad?: string;
  grado_academico?: string;
}

export default function Registro() {
  const [form, setForm] = useState<RegistrationForm>({
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    genero: 'M',
    fecha_nacimiento: '',
    rol: 'estudiante'
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register, resendVerification, isLoading } = useAuth();
  const router = useRouter();

  const escuelas = [
    { id: 1, nombre: 'Ingeniería Electrónica' },
    { id: 2, nombre: 'Ingeniería Informática' },
    { id: 3, nombre: 'Ingeniería en Telecomunicaciones' },
    { id: 4, nombre: 'Ingeniería Mecatrónica' }
  ];

  const grados = ['Licenciado', 'Magister', 'Doctor'];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!form.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }
    
    if (!form.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!form.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (form.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }
    
    if (!form.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    }
    
    if (!form.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    }
    
    if (!form.fecha_nacimiento.trim()) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    }
    
    if (form.rol === 'estudiante') {
      if (!form.codigo?.trim()) {
        newErrors.codigo = 'El código de estudiante es requerido';
      }
      if (!form.id_escuela) {
        newErrors.id_escuela = 'Debe seleccionar una escuela';
      }
    } else {
      if (!form.codigo_profesor?.trim()) {
        newErrors.codigo_profesor = 'El código de profesor es requerido';
      }
      if (!form.especialidad?.trim()) {
        newErrors.especialidad = 'La especialidad es requerida';
      }
      if (!form.grado_academico?.trim()) {
        newErrors.grado_academico = 'El grado académico es requerido';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    const result = await register(form);
    
    if (result.success) {
      if (result.needsVerification) {
        setRegisteredEmail(form.email);
        setShowVerificationMessage(true);
      } else {
        Alert.alert(
          'Registro Exitoso',
          'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
          [
            {
              text: 'Ir a Login',
              onPress: () => router.replace('/login')
            }
          ]
        );
      }
    } else {
      Alert.alert('Error', 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.');
    }
  };

  const handleResendVerification = async () => {
    const success = await resendVerification(registeredEmail);
    if (success) {
      Alert.alert('Correo Reenviado', 'Se ha enviado nuevamente el correo de verificación.');
    } else {
      Alert.alert('Error', 'No se pudo reenviar el correo de verificación.');
    }
  };

  if (showVerificationMessage) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>UNFV</Text>
            <Text style={styles.subtitle}>Verificación de Email</Text>
          </View>

          <Card style={styles.verificationCard}>
            <View style={styles.verificationContent}>
              <Text style={styles.verificationTitle}>¡Registro Exitoso!</Text>
              <Text style={styles.verificationText}>
                Se ha enviado un correo de verificación a:
              </Text>
              <Text style={styles.emailText}>{registeredEmail}</Text>
              <Text style={styles.verificationInstructions}>
                Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.
              </Text>
              <Text style={styles.verificationNote}>
                Una vez verificado tu email, podrás iniciar sesión normalmente.
              </Text>
              
              <Button
                title="Reenviar Correo de Verificación"
                onPress={handleResendVerification}
                variant="secondary"
                style={styles.resendButton}
              />
              
              <Button
                title="Ir a Iniciar Sesión"
                onPress={() => router.replace('/login')}
                style={styles.loginButton}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>UNFV</Text>
          <Text style={styles.subtitle}>Registro de Usuario</Text>
          <Text style={styles.description}>
            Facultad de Ingeniería Electrónica e Informática
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Crear Nueva Cuenta</Text>
          
          {/* Información Personal */}
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <Input
            label="Email"
            value={form.email}
            onChangeText={(text) => setForm({...form, email: text})}
            placeholder="ejemplo@unfv.edu.pe"
            type="email"
            error={errors.email}
            autoCapitalize="none"
          />
          
          <Input
            label="Contraseña"
            value={form.password}
            onChangeText={(text) => setForm({...form, password: text})}
            placeholder="Mínimo 6 caracteres"
            type="password"
            error={errors.password}
          />
          
          <Input
            label="Confirmar Contraseña"
            value={form.confirmPassword}
            onChangeText={(text) => setForm({...form, confirmPassword: text})}
            placeholder="Repite tu contraseña"
            type="password"
            error={errors.confirmPassword}
          />
          
          <Input
            label="DNI"
            value={form.dni}
            onChangeText={(text) => setForm({...form, dni: text})}
            placeholder="12345678"
            keyboardType="numeric"
            error={errors.dni}
            maxLength={8}
          />
          
          <Input
            label="Nombres"
            value={form.nombres}
            onChangeText={(text) => setForm({...form, nombres: text})}
            placeholder="Juan Carlos"
            error={errors.nombres}
          />
          
          <Input
            label="Apellidos"
            value={form.apellidos}
            onChangeText={(text) => setForm({...form, apellidos: text})}
            placeholder="Pérez García"
            error={errors.apellidos}
          />
          
          <Input
            label="Teléfono (Opcional)"
            value={form.telefono}
            onChangeText={(text) => setForm({...form, telefono: text})}
            placeholder="987654321"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.inputLabel}>Género</Text>
          <View style={styles.genderContainer}>
            {[
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' }
            ].map((gender) => (
              <Card 
                key={gender.value}
                style={[
                  styles.genderOption,
                  form.genero === gender.value && styles.genderOptionSelected
                ]}
              >
                <Text 
                  style={[
                    styles.genderText,
                    form.genero === gender.value && styles.genderTextSelected
                  ]}
                  onPress={() => setForm({...form, genero: gender.value})}
                >
                  {gender.label}
                </Text>
              </Card>
            ))}
          </View>
          
          <DatePicker
            label="Fecha de Nacimiento"
            value={form.fecha_nacimiento}
            onValueChange={(value) => setForm({...form, fecha_nacimiento: value})}
            placeholder="Selecciona tu fecha de nacimiento"
            error={errors.fecha_nacimiento}
          />
          
          {/* Tipo de Usuario */}
          <Text style={styles.sectionTitle}>Tipo de Usuario</Text>
          <View style={styles.roleContainer}>
            {[
              { value: 'estudiante', label: 'Estudiante' },
              { value: 'profesor', label: 'Profesor' }
            ].map((role) => (
              <Card 
                key={role.value}
                style={[
                  styles.roleOption,
                  form.rol === role.value && styles.roleOptionSelected
                ]}
              >
                <Text 
                  style={[
                    styles.roleText,
                    form.rol === role.value && styles.roleTextSelected
                  ]}
                  onPress={() => setForm({...form, rol: role.value as any})}
                >
                  {role.label}
                </Text>
              </Card>
            ))}
          </View>
          
          {/* Información Específica */}
          {form.rol === 'estudiante' ? (
            <>
              <Text style={styles.sectionTitle}>Información de Estudiante</Text>
              
              <Input
                label="Código de Estudiante"
                value={form.codigo || ''}
                onChangeText={(text) => setForm({...form, codigo: text})}
                placeholder="E2025001"
                error={errors.codigo}
              />
              
              <SchoolPicker
                label="Escuela"
                value={form.id_escuela}
                onValueChange={(value) => setForm({...form, id_escuela: value})}
                schools={escuelas}
                placeholder="Selecciona tu escuela"
                error={errors.id_escuela}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Información de Profesor</Text>
              
              <Input
                label="Código de Profesor"
                value={form.codigo_profesor || ''}
                onChangeText={(text) => setForm({...form, codigo_profesor: text})}
                placeholder="P001"
                error={errors.codigo_profesor}
              />
              
              <Input
                label="Especialidad"
                value={form.especialidad || ''}
                onChangeText={(text) => setForm({...form, especialidad: text})}
                placeholder="Ingeniería de Software"
                error={errors.especialidad}
              />
              
              <Text style={styles.inputLabel}>Grado Académico</Text>
              <View style={styles.gradeContainer}>
                {grados.map((grado) => (
                  <Card 
                    key={grado}
                    style={[
                      styles.gradeOption,
                      form.grado_academico === grado && styles.gradeOptionSelected
                    ]}
                  >
                    <Text 
                      style={[
                        styles.gradeText,
                        form.grado_academico === grado && styles.gradeTextSelected
                      ]}
                      onPress={() => setForm({...form, grado_academico: grado})}
                    >
                      {grado}
                    </Text>
                  </Card>
                ))}
              </View>
              {errors.grado_academico && <Text style={styles.errorText}>{errors.grado_academico}</Text>}
            </>
          )}
          
          <Button
            title="Registrarse"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />
          
          <Button
            title="¿Ya tienes cuenta? Inicia Sesión"
            onPress={() => router.replace('/login')}
            variant="secondary"
            style={styles.loginButton}
          />
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
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
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DEB887',
    paddingBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
    marginTop: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#DEB887',
    padding: 12,
  },
  genderOptionSelected: {
    borderColor: '#D2691E',
    backgroundColor: '#FFF8DC',
  },
  genderText: {
    textAlign: 'center',
    color: '#8B4513',
    fontSize: 14,
  },
  genderTextSelected: {
    color: '#D2691E',
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#DEB887',
    padding: 16,
  },
  roleOptionSelected: {
    borderColor: '#D2691E',
    backgroundColor: '#FFF8DC',
  },
  roleText: {
    textAlign: 'center',
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#D2691E',
    fontWeight: '700',
  },
  gradeContainer: {
    marginBottom: 16,
  },
  gradeOption: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DEB887',
    padding: 12,
  },
  gradeOptionSelected: {
    borderColor: '#D2691E',
    backgroundColor: '#FFF8DC',
  },
  gradeText: {
    textAlign: 'center',
    color: '#8B4513',
    fontSize: 14,
  },
  gradeTextSelected: {
    color: '#D2691E',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#DC143C',
    marginTop: 4,
  },
  registerButton: {
    marginTop: 20,
    backgroundColor: '#D2691E',
  },
  loginButton: {
    marginTop: 12,
  },
  verificationCard: {
    marginTop: 20,
  },
  verificationContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D2691E',
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationInstructions: {
    fontSize: 14,
    color: '#A0522D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  verificationNote: {
    fontSize: 12,
    color: '#CD853F',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  resendButton: {
    marginBottom: 12,
    width: '100%',
  },
});