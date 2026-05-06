import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient, setLogoutCallback } from '@/api/client';
import { useRouter, useSegments } from 'expo-router';

// Tipos de datos para el usuario
export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokenData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // El logout limpia todo y nos devuelve al login
  const logout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setUser(null);
  };

  // Conectamos la función de logout al interceptor de Axios
  useEffect(() => {
    setLogoutCallback(logout);
  }, []);

  // Busca los datos reales del usuario en el backend
  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.log('Error fetching user profile', error);
      logout();
    }
  };

  // Función de login (se llamará después de obtener los tokens en el POST /auth/login)
  const login = async (tokenData: { access_token: string; refresh_token: string }) => {
    await SecureStore.setItemAsync('access_token', tokenData.access_token);
    await SecureStore.setItemAsync('refresh_token', tokenData.refresh_token);
    await refreshUser();
  };

  // Al abrir la app, comprobamos si tenemos tokens válidos
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          await refreshUser();
        }
      } catch (e) {
        // Ignorar
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // El "Guardia de Seguridad": vigila a dónde vamos y redirige si hace falta
  useEffect(() => {
    if (isLoading) return;

    // "segments" nos dice en qué carpeta estamos (ej: ['(auth)', 'login'])
    const inAuthGroup = segments[0] === '(auth)';
    const isAuthenticated = !!user;

    if (!isAuthenticated && !inAuthGroup) {
      // Si no estoy logueado e intento entrar a tabs, pa'fuera
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Si estoy logueado e intento ver el login, para los tabs
      router.replace('/(tabs)/habits');
    }
  }, [user, segments, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook fácil de usar para cualquier pantalla
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
