import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { LegendTitle } from '../../api/stats';

interface LegendTitleBadgeProps {
  title: LegendTitle | null;
}

export const LegendTitleBadge: React.FC<LegendTitleBadgeProps> = ({ title }) => {
  const { t } = useTheme();

  if (!title) {
    return (
      <Text style={[styles.badge, styles.noTitle, { color: t.muted }]}>
        Aspirante a Leyenda
      </Text>
    );
  }

  return (
    <Text 
      style={[
        styles.badge, 
        { 
          color: t.accent, 
          borderColor: t.accent + '40',
          backgroundColor: t.accent + '10' 
        }
      ]}
    >
      {title.icon} {title.name.toUpperCase()}
    </Text>
  );
};

const styles = StyleSheet.create({
  badge: {
    fontFamily: typography.fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: 4,
    overflow: 'hidden',
  },
  noTitle: {
    borderColor: 'transparent',
    fontStyle: 'italic',
    fontWeight: '400',
  }
});
