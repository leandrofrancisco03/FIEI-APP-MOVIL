import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/database';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<{ success: boolean; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  genero?: string;
  fecha_nacimiento: string;
  rol: 'estudiante' | 'profesor';
  codigo?: string;
  codigo_profesor?: string;
  id_escuela?: number;
  especialidad?: string;
  grado_academico?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Only load user data if email is confirmed
          if (session.user.email_confirmed_at) {
            await loadUserData(session.user.id);
          } else {
            // User exists but email not confirmed
            if (isMountedRef.current) {
              setUser(null);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMountedRef.current) {
            setUser(null);
          }
        }
        
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      console.log('Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email_confirmed_at && isMountedRef.current) {
        console.log('Found existing session for user:', session.user.id);
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);
      
      // First get basic user data - use maybeSingle() to handle missing records gracefully
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, nombres, apellidos, rol')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      // Handle case where no user data is found
      if (!userData) {
        console.warn('No user profile data found for authenticated user:', userId);
        if (isMountedRef.current) {
          setUser(null);
        }
        return;
      }

      console.log('User data loaded:', userData);

      let authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        rol: userData.rol,
      };

      // Get role-specific data
      if (userData.rol === 'estudiante') {
        console.log('Loading student data for:', userId);
        
        const { data: studentData, error: studentError } = await supabase
          .from('estudiantes')
          .select('codigo, id_escuela')
          .eq('id', userId)
          .limit(1);

        if (studentError) {
          console.error('Error fetching student data:', studentError);
          // Don't throw error, just log it and continue without student data
        } else if (studentData && studentData.length > 0) {
          console.log('Student data loaded:', studentData[0]);
          authUser.codigo = studentData[0].codigo;
          authUser.id_escuela = studentData[0].id_escuela;
        } else {
          console.warn('No student data found for user:', userId);
        }
      } else if (userData.rol === 'profesor') {
        console.log('Loading professor data for:', userId);
        
        const { data: professorData, error: professorError } = await supabase
          .from('profesores')
          .select('codigo_profesor')
          .eq('id', userId)
          .limit(1);

        if (professorError) {
          console.error('Error fetching professor data:', professorError);
          // Don't throw error, just log it and continue without professor data
        } else if (professorData && professorData.length > 0) {
          console.log('Professor data loaded:', professorData[0]);
          authUser.codigo_profesor = professorData[0].codigo_profesor;
        } else {
          console.warn('No professor data found for user:', userId);
        }
      }

      console.log('Final auth user:', authUser);

      if (isMountedRef.current) {
        setUser(authUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (isMountedRef.current) {
        setUser(null);
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        // Check if error is due to email not confirmed
        if (error.message.includes('email not confirmed')) {
          throw new Error('Por favor verifica tu correo electrónico antes de iniciar sesión');
        }
        throw error;
      }

      console.log('Login successful for user:', data.user?.id);

      if (data.user && data.user.email_confirmed_at && isMountedRef.current) {
        await loadUserData(data.user.id);
        
        // Update last connection
        await supabase
          .from('usuarios')
          .update({ ultima_conexion: new Date().toISOString() })
          .eq('id', data.user.id);
      } else if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Por favor verifica tu correo electrónico antes de iniciar sesión');
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; needsVerification?: boolean }> => {
    try {
      if (isMountedRef.current) {
        setIsLoading(true);
      }

      console.log('Attempting registration for:', userData.email, 'as', userData.rol);

      // Create auth user with email confirmation required
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('No user returned from signup');
        throw new Error('User creation failed');
      }

      console.log('Auth user created:', authData.user.id, 'Email confirmed:', authData.user.email_confirmed_at);

      // Insert user data in usuarios table
      console.log('Inserting user data...');
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: userData.email,
          password: 'hashed', // This will be handled by Supabase Auth
          dni: userData.dni,
          nombres: userData.nombres,
          apellidos: userData.apellidos,
          telefono: userData.telefono,
          genero: userData.genero,
          fecha_nacimiento: userData.fecha_nacimiento,
          rol: userData.rol,
        });

      if (userError) {
        console.error('Error inserting user data:', userError);
        throw userError;
      }

      console.log('User data inserted successfully');

      // Insert role-specific data
      if (userData.rol === 'estudiante') {
        console.log('Inserting student data...');
        const { error: studentError } = await supabase
          .from('estudiantes')
          .insert({
            id: authData.user.id,
            codigo: userData.codigo!,
            id_escuela: userData.id_escuela!,
          });

        if (studentError) {
          console.error('Error inserting student data:', studentError);
          throw studentError;
        }
        
        console.log('Student data inserted successfully');
      } else if (userData.rol === 'profesor') {
        console.log('Inserting professor data...');
        const { error: professorError } = await supabase
          .from('profesores')
          .insert({
            id: authData.user.id,
            codigo_profesor: userData.codigo_profesor!,
            especialidad: userData.especialidad,
            grado_academico: userData.grado_academico,
          });

        if (professorError) {
          console.error('Error inserting professor data:', professorError);
          throw professorError;
        }
        
        console.log('Professor data inserted successfully');
      }

      // Check if user needs to confirm email
      if (!authData.user.email_confirmed_at) {
        console.log('User needs email verification');
        return { success: true, needsVerification: true };
      }

      console.log('Registration completed successfully without verification needed');
      return { success: true, needsVerification: false };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false };
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      console.log('Resending verification email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (error) throw error;
      
      console.log('Verification email resent successfully');
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user...');
      
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      
      // Clear user state immediately
      if (isMountedRef.current) {
        setUser(null);
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Even if there's an error, we still want to clear the local state
      } else {
        console.log('Logout successful');
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the user state even if there's an error
      if (isMountedRef.current) {
        setUser(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}