import { useFonts as useExpoFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { SourceSerif4_500Medium } from '@expo-google-fonts/source-serif-4';

export function useCustomFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    Inter_400Regular,
    Inter_500Medium,
    SourceSerif4_500Medium,
  });

  return { fontsLoaded, fontError };
}
