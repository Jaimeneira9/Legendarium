import React, { useRef } from 'react';
import { 
  Animated, 
  TouchableWithoutFeedback, 
  ViewStyle, 
  StyleProp,
  TouchableWithoutFeedbackProps
} from 'react-native';
import { useHaptics } from '../../hooks/useHaptics';

interface TouchableScaleProps extends TouchableWithoutFeedbackProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';
}

/**
 * A wrapper for touchable elements that adds a subtle scale animation
 * and haptic feedback on press.
 */
export const TouchableScale: React.FC<TouchableScaleProps> = ({ 
  children, 
  style, 
  scaleTo = 0.96, 
  haptic = 'light',
  onPress,
  onPressIn,
  onPressOut,
  ...props 
}) => {
  const { impactLight, impactMedium, impactHeavy, selection, success } = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    // Trigger haptic on press start for immediate feedback
    if (haptic === 'light') impactLight();
    else if (haptic === 'medium') impactMedium();
    else if (haptic === 'heavy') impactHeavy();
    else if (haptic === 'selection') selection();
    else if (haptic === 'success') success();

    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();

    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();

    onPressOut?.(e);
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
