const fonts = {
  serif: 'SourceSerif4_500Medium',
  sans: 'Inter_500Medium',
  sansRegular: 'Inter_400Regular',
  sansSemiBold: 'Inter_600SemiBold',
};

export const typography = {
  fonts,
  sizes: {
    xs: 10.5,
    sm: 12.5,
    md: 14,
    base: 16,
    lg: 19,
    xl: 28,
    xxl: 32,
  },
  lineHeights: {
    tight: 1.05,
    snug: 1.2,
    base: 1.6,
  },
  styles: {
    screenTitle: {
      fontFamily: fonts.serif,
      fontSize: 32,
      lineHeight: 33.6, // 32 * 1.05
    },
    cardTitle: {
      fontFamily: fonts.serif,
      fontSize: 19,
      lineHeight: 22.8, // 19 * 1.2
    },
    streakNumber: {
      fontFamily: fonts.serif,
      fontSize: 28,
      lineHeight: 28, // 28 * 1.0
    },
    eyebrow: {
      fontFamily: fonts.sans,
      fontSize: 11,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
    },
    body: {
      fontFamily: fonts.sans,
      fontSize: 16,
      lineHeight: 25.6, // 16 * 1.6
    },
    caption: {
      fontFamily: fonts.sansRegular,
      fontSize: 12.5,
    },
    label: {
      fontFamily: fonts.sans,
      fontSize: 10.5,
      letterSpacing: 0.3,
    },
    chip: {
      fontFamily: fonts.sans,
      fontSize: 13,
    },
  },
};
