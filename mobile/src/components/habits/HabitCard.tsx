import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableScale } from '../ui/TouchableScale';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { Habit } from '../../api/habits';

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void;
  onLongPress?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, onLongPress }) => {
  const { t } = useTheme();
  const isCompleted = habit.completed_today;

  return (
    <View style={styles.cardWrapper}>
      <View 
        style={[
          styles.container, 
          { 
            backgroundColor: t.panel, 
            borderColor: isCompleted ? t.accent : t.ring 
          }
        ]}
      >
        <TouchableScale
          onPress={onToggle}
          onLongPress={onLongPress}
          style={styles.pressable}
          haptic={isCompleted ? 'light' : 'medium'}
          scaleTo={0.98}
        >
          <View style={styles.leftContent}>
            <View style={[styles.iconContainer, { backgroundColor: isCompleted ? t.accent + '20' : t.bg }]}>
              {habit.image_url ? (
                <Image
                  source={{ uri: habit.image_url }}
                  style={styles.habitImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.icon}>{habit.icon || '✦'}</Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: t.ink }]}>{habit.name}</Text>
              <Text style={[styles.streak, { color: t.muted }]}>
                {isCompleted
                  ? `✓ ${habit.current_streak || 1} días seguidos`
                  : habit.current_streak
                    ? `🔥 Racha: ${habit.current_streak} días`
                    : 'Sin racha activa'
                }
              </Text>
            </View>
          </View>

          <View 
            style={[
              styles.checkbox, 
              { 
                backgroundColor: isCompleted ? t.accent : 'transparent',
                borderColor: isCompleted ? t.accent : t.ringStrong 
              }
            ]}
          >
            {isCompleted && <Text style={styles.checkIcon}>✓</Text>}
          </View>
        </TouchableScale>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  habitImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    marginBottom: 2,
  },
  streak: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
