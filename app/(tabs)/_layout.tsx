import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { House, ClipboardList, User, FileText } from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();
  
  if (!user) return null;

  console.log('🔍 TabLayout - User rol:', user.rol);

  // Layout específico para profesores - SIN cursos ni buscar
  if (user.rol === 'profesor') {
    console.log('👨‍🏫 PROFESOR: Mostrando layout sin Cursos/Buscar');
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
            paddingTop: 8,
            paddingBottom: 8,
            height: 75,
            // Cambiar shadow* por boxShadow para web
            boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <House size={focused ? 28 : 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notas"
          options={{
            title: 'Notas',
            tabBarIcon: ({ color, focused }) => (
              <FileText size={focused ? 28 : 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="asistencias"
          options={{
            title: 'Asistencias',
            tabBarIcon: ({ color, focused }) => (
              <ClipboardList size={focused ? 28 : 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <User size={focused ? 28 : 24} color={color} />
            ),
          }}
        />
        {/* OCULTAR COMPLETAMENTE cursos y buscar para profesores */}
        <Tabs.Screen
          name="cursos"
          options={{
            href: null, // Esto oculta la pestaña completamente
          }}
        />
        <Tabs.Screen
          name="buscar"
          options={{
            href: null, // Esto oculta la pestaña completamente
          }}
        />
      </Tabs>
    );
  }

  // Layout para estudiantes - CON todas las pestañas
  console.log('🎓 ESTUDIANTE: Mostrando layout completo');
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
          paddingTop: 8,
          paddingBottom: 8,
          height: 75,
          // Cambiar shadow* por boxShadow para web
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <House size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color, focused }) => {
            // Importación dinámica para evitar problemas
            const { BookOpen } = require('lucide-react-native');
            return <BookOpen size={focused ? 28 : 24} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, focused }) => {
            // Importación dinámica para evitar problemas
            const { Search } = require('lucide-react-native');
            return <Search size={focused ? 28 : 24} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="notas"
        options={{
          title: 'Notas',
          tabBarIcon: ({ color, focused }) => (
            <FileText size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asistencias"
        options={{
          title: 'Asistencias',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <User size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}