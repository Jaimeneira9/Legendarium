// Theme tokens — light (pergamino) and dark (midnight library)
const THEMES = {
  light: {
    bg: '#f5f4ed',
    panel: '#faf9f5',
    ink: '#141413',
    muted: '#8a8478',
    mutedStrong: '#7a7568',
    accent: '#c96442',
    ring: '#eae6d6',
    ringStrong: '#d4cfbe',
    radio: '#d4cfbe',
    chipBg: '#141413',
    chipInk: '#f5f4ed',
    tabText: '#141413',
    tabInactive: '#a8a296',
  },
  dark: {
    bg: '#1a1813',
    panel: '#23201a',
    ink: '#f2ecdb',
    muted: '#8a8478',
    mutedStrong: '#a8a296',
    accent: '#e07a52',
    ring: '#332e25',
    ringStrong: '#4a4337',
    radio: '#4a4337',
    chipBg: '#f2ecdb',
    chipInk: '#1a1813',
    tabText: '#f2ecdb',
    tabInactive: '#6b6558',
  },
};

window.useTheme = function(dark) {
  return React.useMemo(() => dark ? THEMES.dark : THEMES.light, [dark]);
};
window.THEMES = THEMES;
