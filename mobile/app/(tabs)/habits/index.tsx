import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { ScreenHeader, Button, EmptyState } from '@/components/ui';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitModal } from '@/components/habits/CreateHabitModal';
import { habitApi, Habit, HabitCreateData } from '@/api/habits';
import { useHaptics } from '@/hooks/useHaptics';

export default function HabitsScreen() {
  const { t } = useTheme();
  const { success, warning } = useHaptics();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      const data = await habitApi.getTodayHabits();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHabits();
  };

  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedHabit(null);
  };

  // Guardamos los timeouts de cada hábito para poder cancelarlos si el usuario pulsa rápido
  const syncTimeouts = React.useRef<Record<string, any>>({});

  const handleToggleHabit = (habit: Habit) => {
    const wasCompleted = habit.completed_today;
    const newStatus = !wasCompleted;

    // 1. Actualización visual instantánea
    setHabits(prev => prev.map(h => 
      h.id === habit.id 
        ? { 
            ...h, 
            completed_today: newStatus, 
            current_streak: newStatus ? (h.current_streak || 0) + 1 : Math.max(0, (h.current_streak || 1) - 1) 
          }
        : h
    ));
    
    if (newStatus) {
      success();
    }

    // 2. Cancelar cualquier sincronización pendiente para este hábito
    if (syncTimeouts.current[habit.id]) {
      clearTimeout(syncTimeouts.current[habit.id]);
    }

    // 3. Programar la sincronización real para dentro de 1 segundo
    syncTimeouts.current[habit.id] = setTimeout(async () => {
      try {
        if (newStatus) {
          await habitApi.logHabit(habit.id);
        } else {
          const today = new Date().toISOString().split('T')[0];
          await habitApi.unlogHabit(habit.id, today);
        }
        // 4. Tras sincronizar, refrescamos para obtener la racha "real" del servidor
        const updatedHabits = await habitApi.getTodayHabits();
        setHabits(updatedHabits);
      } catch (error) {
        // Ignorar 409 (ya estaba marcado) o 404 (ya estaba borrado)
        if (error.response?.status !== 409 && error.response?.status !== 404) {
          console.error('Sync failed:', error);
          fetchHabits(); // Revertir a estado servidor
        }
      } finally {
        delete syncTimeouts.current[habit.id];
      }
    }, 1000);
  };

  const handleCreateHabit = async (data: HabitCreateData) => {
    try {
      await habitApi.createHabit(data);
      success();
      fetchHabits();
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const handleUpdateHabit = async (id: string, data: Partial<HabitCreateData>) => {
    try {
      await habitApi.updateHabit(id, data);
      fetchHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await habitApi.deleteHabit(id);
      warning();
      fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HabitCard 
            habit={item} 
            onToggle={() => handleToggleHabit(item)} 
            onLongPress={() => handleEditHabit(item)}
          />
        )}
        ListHeaderComponent={
          <ScreenHeader 
            eyebrow="PRÁCTICA DIARIA" 
            title="Hábitos" 
            trailing={
              <Button 
                variant="ghost" 
                size="sm" 
                title="+ Añadir" 
                onPress={() => setModalVisible(true)} 
              />
            }
          />
        }
        ListEmptyComponent={
          <EmptyState 
            icon="🌱"
            title="Sin hábitos para hoy"
            description="La constancia es la clave. Empieza con algo pequeño y construye tu leyenda día a día."
            actionLabel="Crear mi primer hábito"
            onAction={() => setModalVisible(true)}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
      />

      <CreateHabitModal 
        visible={modalVisible} 
        onClose={handleCloseModal}
        onCreate={handleCreateHabit}
        onUpdate={handleUpdateHabit}
        onDelete={handleDeleteHabit}
        habit={selectedHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 24,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
