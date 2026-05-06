import * as Haptics from 'expo-haptics';

/**
 * Custom hook to centralize haptic feedback logic.
 * This allows for global disabling of haptics if needed in the future.
 */
export const useHaptics = () => {
  const selection = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  const impactLight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const impactMedium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const impactHeavy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const success = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const warning = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const error = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  return {
    selection,
    impactLight,
    impactMedium,
    impactHeavy,
    success,
    warning,
    error,
  };
};
