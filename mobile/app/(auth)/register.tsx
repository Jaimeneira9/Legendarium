import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { ScreenHeader, Input, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { spacing, typography } from '@/theme';

export default function RegisterScreen() {
  const { t } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email y contraseña son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Registramos al usuario
      const data = await authApi.register(email, password, displayName);
      
      // 2. Si el registro tiene éxito, el backend nos devuelve los tokens 
      // de la sesión recién creada (en nuestro endpoint de FastAPI lo configuramos así).
      await login(data);
      
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Error al crear la cuenta';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: t.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSpacer} />
        
        <ScreenHeader 
          eyebrow="ÚNETE AL VIAJE" 
          title="Crear Cuenta" 
        />

        <View style={styles.form}>
          <Input
            label="NOMBRE (OPCIONAL)"
            placeholder="¿Cómo te llamas?"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label="EMAIL"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="CONTRASEÑA"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.buttonContainer}>
            <Button 
              title={isSubmitting ? 'Creando cuenta...' : 'Registrarse'} 
              onPress={handleRegister} 
              fullWidth 
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[typography.styles.caption, { color: t.muted }]}>
            ¿Ya tienes una cuenta?{' '}
            <Text 
              style={{ color: t.accent, fontWeight: '600' }} 
              onPress={() => router.push('/(auth)/login')}
            >
              Inicia sesión
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  headerSpacer: {
    height: 40,
  },
  form: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
});
