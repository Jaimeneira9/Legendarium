import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const storageApi = {
  uploadHabitImage: async (uri: string): Promise<string> => {
    return uploadFile(uri, 'habit-images', 'habits');
  },

  uploadAvatar: async (uri: string, userId: string): Promise<string> => {
    // Usamos el userId como carpeta para cumplir con las políticas RLS
    return uploadFile(uri, 'avatars', userId);
  }
};

async function uploadFile(uri: string, bucket: string, folder: string): Promise<string> {
  const fileName = `${Date.now()}.jpg`;
  const filePath = `${folder}/${fileName}`;

  try {
    const token = await SecureStore.getItemAsync('access_token');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const uint8Array = toByteArray(base64);
    const arrayBuffer = uint8Array.buffer;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error(`Supabase Storage Error (${bucket}):`, error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error(`Failed to process image for upload to ${bucket}:`, err);
    throw err;
  }
}
