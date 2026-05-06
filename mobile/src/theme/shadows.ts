import { ViewStyle } from 'react-native';
import { ThemeColors } from './colors';

// En React Native no existe box-shadow: 0 0 0 1px color como en CSS.
// Lo simulamos con borderWidth y borderColor.
export const getShadows = (t: ThemeColors) => ({
  ring: {
    borderWidth: 1,
    borderColor: t.ring,
  } as ViewStyle,
  ringStrong: {
    borderWidth: 1,
    borderColor: t.ringStrong,
  } as ViewStyle,
  // Si en el futuro necesitamos alguna sombra paralela muy sutil:
  drop: {
    shadowColor: t.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
});
