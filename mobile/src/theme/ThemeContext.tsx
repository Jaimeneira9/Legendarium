import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { colors, ThemeColors, ThemeMode } from './colors';

type ThemeContextType = {
  isDark: boolean;
  mode: ThemeMode;
  t: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  mode: 'system',
  t: colors.light,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useNativeColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  // isDark is true if mode is dark, midnight, or if system is dark
  const isDark = mode === 'system' 
    ? systemColorScheme === 'dark' 
    : (mode === 'dark' || mode === 'midnight');

  // Select the theme based on the mode
  let t = colors.light;
  if (mode === 'midnight') {
    t = colors.midnight;
  } else if (mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark')) {
    t = colors.dark;
  }

  const toggleTheme = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('midnight');
    else setMode('light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, mode, t, toggleTheme, setTheme: setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
