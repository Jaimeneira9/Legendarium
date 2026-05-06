import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return <Redirect href={isAuthenticated ? '/(tabs)/habits' : '/(auth)/login'} />;
}
