import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, spacing, getShadows } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false, 
  disabled = false,
  style
}: ButtonProps) {
  const { t } = useTheme();
  const shadows = getShadows(t);
  const { impactLight } = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    impactLight();
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';

  const getButtonStyles = (pressed: boolean) => {
    const baseStyle: ViewStyle = {
      height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
      paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
      opacity: disabled ? 0.5 : 1,
    };

    if (isPrimary) {
      return {
        ...baseStyle,
        backgroundColor: t.accent,
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
      };
    }

    if (isSecondary) {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        ...shadows.ring,
        ...(pressed ? { backgroundColor: t.panel } : {}),
      };
    }

    if (isGhost) {
      return {
        ...baseStyle,
        backgroundColor: pressed ? t.panel : 'transparent',
      };
    }

    return baseStyle;
  };

  const getTextColor = () => {
    if (isPrimary) return '#ffffff';
    if (isGhost) return t.accent;
    return t.ink;
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          getButtonStyles(pressed),
        ]}
      >
        <Text
          style={[
            typography.styles.body,
            { 
              color: getTextColor(), 
              fontSize: size === 'sm' ? 14 : 16,
              fontWeight: '600' 
            }
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
