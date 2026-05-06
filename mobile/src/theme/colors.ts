export const colors = {
  light: {
    bg: '#f5f4ed',       // Parchment
    panel: '#faf9f5',    // Slightly lighter parchment for cards
    ink: '#141413',      // Almost black for text
    muted: '#8a8478',    // Warm gray for secondary text
    accent: '#c96442',   // Terracotta for primary CTAs
    ring: '#eae6d6',     // Subtle border
    ringStrong: '#d4cfbe', // Hover/Active border
    overlay: 'rgba(20, 20, 19, 0.4)', // Modal backdrop
  },
  dark: {
    bg: '#1a1813',       // Very dark warm gray/brown
    panel: '#23201a',    // Card background
    ink: '#f2ecdb',      // Off-white text
    muted: '#8a8478',    // Same warm gray for secondary text
    accent: '#e07a52',   // Brighter terracotta for dark mode
    ring: '#332e25',     // Subtle border
    ringStrong: '#4a4337', // Hover/Active border
    overlay: 'rgba(10, 9, 7, 0.8)', // Modal backdrop
  },
  midnight: {
    bg: '#0c121a',       // Deep Midnight Blue
    panel: '#151e29',    // Midnight Card
    ink: '#e6edf3',      // Soft blue-white text
    muted: '#8492a6',    // Steel blue gray
    accent: '#b99d6b',   // Dusty Gold
    ring: '#243141',     // Blue-gray border
    ringStrong: '#32455c',
    overlay: 'rgba(6, 9, 13, 0.85)',
  }
};

export type ThemeColors = typeof colors.light;
export type ThemeMode = 'light' | 'dark' | 'midnight' | 'system';
