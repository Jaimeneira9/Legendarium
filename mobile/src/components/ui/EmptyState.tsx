import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ title, description, icon, actionLabel, onAction }: EmptyStateProps) => {
  const { t } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
      <Text style={[styles.description, { color: t.muted }]}>{description}</Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: t.accent }]} 
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.8,
  },
  title: {
    fontSize: 22,
    fontFamily: typography.fonts.serif,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: typography.fonts.sans,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
