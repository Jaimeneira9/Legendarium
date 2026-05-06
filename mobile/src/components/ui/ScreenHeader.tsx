import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, spacing } from '@/theme';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  trailing?: React.ReactNode;
}

export function ScreenHeader({ eyebrow, title, trailing }: ScreenHeaderProps) {
  const { t } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {eyebrow && (
          <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: spacing.sm }]}>
            {eyebrow}
          </Text>
        )}
        <Text style={[typography.styles.screenTitle, { color: t.ink }]}>{title}</Text>
      </View>
      {trailing && <View style={styles.trailingContainer}>{trailing}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  textContainer: {
    flex: 1,
  },
  trailingContainer: {
    marginLeft: spacing.md,
    paddingBottom: 4, // Aligns better with the serif baseline
  },
});
