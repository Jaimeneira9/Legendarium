import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, getShadows } from '@/theme';

interface ChipFilterProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function ChipFilter({ label, active, onPress }: ChipFilterProps) {
  const { t, isDark } = useTheme();
  const shadows = getShadows(t);

  // Colores invertidos para el estado activo:
  // En modo claro: activo = oscuro, inactivo = claro
  // En modo oscuro: activo = claro, inactivo = oscuro
  const activeBg = isDark ? '#eae6d6' : '#23201a';
  const activeText = isDark ? '#141413' : '#f5f4ed';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active ? { backgroundColor: activeBg } : { backgroundColor: 'transparent' },
        !active && shadows.ring,
      ]}
    >
      <Text
        style={[
          typography.styles.chip,
          { color: active ? activeText : t.muted }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20, // Forma de pastilla
    marginRight: 8,
  },
});
