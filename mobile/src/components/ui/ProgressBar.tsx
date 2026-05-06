import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0 a 1
  color?: string; // Por defecto usa el accent color
}

export function ProgressBar({ progress, color }: ProgressBarProps) {
  const { t } = useTheme();
  
  // Asegurar que progress está entre 0 y 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const widthPercentage = `${clampedProgress * 100}%`;

  return (
    <View style={[styles.track, { backgroundColor: t.ring }]}>
      <Animated.View 
        style={[
          styles.fill, 
          { 
            backgroundColor: color || t.accent,
            width: widthPercentage as any,
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
