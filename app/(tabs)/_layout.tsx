import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { House, Search, BookOpen, Users, ClipboardList, User, GraduationCap, FileText } from 'lucide-react-native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { user } = useAuth();
  
  // Debug logs para verificar el usuario y rol
  console.log('TabLayout - User:', user);
  console.log('TabLayout - User rol:', user?.rol);
  
  if (!user) return null;

  const isStudent = user.rol?.trim().toLowerCase() === 'estudiante';
  const isProfesor = user.rol?.trim().toLowerCase() === 'profesor';
  
  // Debug logs para verificar las condiciones
  console.log('TabLayout - isStudent:', isStudent);
  console.log('TabLayout - isProfesor:', isProfesor);
  console.log('TabLayout - rol original:', `"${user.rol}"`);
  console.log('TabLayout - rol trimmed:', `"${user.rol?.trim()}"`);
  
  // Si sigues viendo las pestañas, significa que isStudent está siendo true
  if (isStudent) {
    console.log('🟢 Mostrando pestañas de ESTUDIANTE (Cursos y Buscar)');
  } else if (isProfesor) {
    console.log('🔵 Mostrando pestañas de PROFESOR (sin Cursos ni Buscar)');
  } else {
    console.log('⚠️ Rol no reconocido:', user.rol);
  }

  // Calculate responsive values
  const isSmallScreen = width < 400;
  const tabBarHeight = isSmallScreen ? 65 : 75;
  const iconSize = isSmallScreen ? 20 : 24;
  const activeIconSize = isSmallScreen ? 24 : 28;
  const fontSize = isSmallScreen ? 10 : 12;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D2691E',
        tabBarInactiveTintColor: '#A0522D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#DEB887',
          borderTopWidth: 1,
          paddingTop: isSmallScreen ? 6 : 8,
          paddingBottom: isSmallScreen ? 6 : 8,
          height: tabBarHeight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ size, color, focused }) => (
            <House 
              size={focused ? activeIconSize : iconSize} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      {(isStudent && user.rol?.trim().toLowerCase() === 'estudiante') && (
        <>
          <Tabs.Screen
            name="cursos"
            options={{
              title: 'Cursos',
              tabBarIcon: ({ size, color, focused }) => (
                <BookOpen 
                  size={focused ? activeIconSize : iconSize} 
                  color={color} 
                  strokeWidth={focused ? 2.5 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="buscar"
            options={{
              title: 'Buscar',
              tabBarIcon: ({ size, color, focused }) => (
                <Search 
                  size={focused ? activeIconSize : iconSize} 
                  color={color} 
                  strokeWidth={focused ? 2.5 : 2}
                />
              ),
            }}
          />
        </>
      )}
      
      <Tabs.Screen
        name="notas"
        options={{
          title: 'Notas',
          tabBarIcon: ({ size, color, focused }) => (
            <FileText 
              size={focused ? activeIconSize : iconSize} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="asistencias"
        options={{
          title: isSmallScreen ? 'Asist.' : 'Asistencias',
          tabBarIcon: ({ size, color, focused }) => (
            <ClipboardList 
              size={focused ? activeIconSize : iconSize} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color, focused }) => (
            <User 
              size={focused ? activeIconSize : iconSize} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}