import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  annual_reading_goal?: number;
  annual_movie_goal?: number;
  reading_speed?: number;
}

export interface ProfileUpdateData {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  annual_reading_goal?: number;
  annual_movie_goal?: number;
  reading_speed?: number;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data; // Devuelve { access_token, refresh_token, expires_in, token_type }
  },

  register: async (email: string, password: string, displayName?: string) => {
    const response = await apiClient.post('/auth/register', { 
      email, 
      password, 
      display_name: displayName 
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateMe: async (data: ProfileUpdateData): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me', data);
    return response.data;
  }
};
