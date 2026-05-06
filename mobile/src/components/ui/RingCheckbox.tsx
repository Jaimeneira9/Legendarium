import React, { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { getShadows } from '@/theme';

interface RingCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

export function RingCheckbox({ checked, onToggle, size = 32 }: RingCheckboxProps) {
  const { t } = useTheme();
  const shadows = getShadows(t);
  
  // Animación para el relleno interior
  const scale = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [checked, scale]);

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={12} // Área de toque más grande para facilitar el tap
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        shadows.ring,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: t.accent,
            borderRadius: size / 2,
            transform: [{ scale }],
            // El relleno es ligeramente más pequeño que el contenedor
            width: size - 4,
            height: size - 4,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  fill: {
    position: 'absolute',
  },
});
