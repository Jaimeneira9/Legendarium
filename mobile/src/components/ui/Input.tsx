import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, spacing, getShadows } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { t } = useTheme();
  const shadows = getShadows(t);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: spacing.xs, fontSize: 10 }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: t.panel },
          isFocused ? shadows.ringStrong : shadows.ring,
          error ? { borderColor: '#c94242' } : null, // Rojo sutil para errores
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: t.ink, fontFamily: typography.fonts.sans }
          ]}
          placeholderTextColor={t.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={[styles.errorText, { color: '#c94242' }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  inputContainer: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.fonts.sans,
  },
});
