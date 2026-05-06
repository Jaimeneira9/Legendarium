import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { ScreenHeader, Input, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { spacing, typography } from '@/theme';

export default function LoginScreen() {
  const { t } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authApi.login(email, password);
      await login(data);
      // El AuthContext detectará el login y nos mandará a (tabs) automáticamente
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Error al iniciar sesión';
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
          eyebrow="BIENVENIDO DE NUEVO" 
          title="Legendarium" 
        />

        <View style={styles.form}>
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
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.buttonContainer}>
            <Button 
              title={isSubmitting ? 'Entrando...' : 'Entrar'} 
              onPress={handleLogin} 
              fullWidth 
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.line, { backgroundColor: t.ring }]} />
            <Text style={[styles.dividerText, { color: t.muted }]}>o también</Text>
            <View style={[styles.line, { backgroundColor: t.ring }]} />
          </View>

          <Button 
            title="Continuar con Google" 
            onPress={() => Alert.alert('Próximamente', 'La integración con Google requiere configuración adicional.')} 
            variant="secondary"
            fullWidth 
          />
        </View>

        <View style={styles.footer}>
          <Text style={[typography.styles.caption, { color: t.muted }]}>
            ¿No tienes cuenta?{' '}
            <Text 
              style={{ color: t.accent, fontWeight: '600' }} 
              onPress={() => router.push('/(auth)/register')}
            >
              Regístrate
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
});
