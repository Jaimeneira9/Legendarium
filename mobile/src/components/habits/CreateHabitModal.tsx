import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Input, Button } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { HabitCreateData, Habit } from '../../api/habits';
import { storageApi } from '../../api/storage';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: HabitCreateData) => void;
  onUpdate?: (id: string, data: Partial<HabitCreateData>) => void;
  onDelete?: (id: string) => void;
  habit?: Habit | null; // Si se pasa, estamos en modo edición
}

const CATEGORIES = [
  { label: 'Salud', icon: '🥗' },
  { label: 'Espiritualidad', icon: '🧘' },
  { label: 'Mejora Personal', icon: '📚' },
  { label: 'Social', icon: '🤝' },
  { label: 'Trabajo', icon: '💼' },
];

const DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 7 },
];

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({ 
  visible, onClose, onCreate, onUpdate, onDelete, habit 
}) => {
  const { t } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      // Extraer descripción limpia si guardamos categoría: descripción
      const descParts = habit.description?.split(': ') || [];
      setDescription(descParts.length > 1 ? descParts[1] : (habit.description || ''));
      
      const cat = CATEGORIES.find(c => c.icon === habit.icon) || CATEGORIES[0];
      setSelectedCategory(cat);
      setSelectedDays(habit.target_days);
      setImageUri(habit.image_url || null);
    } else {
      setName('');
      setDescription('');
      setSelectedCategory(CATEGORIES[0]);
      setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
      setImageUri(null);
    }
  }, [habit, visible]);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para elegir una foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setUploading(true);
    try {
      let finalImageUrl = imageUri;

      // Si tenemos una URI y no es una URL remota (http), hay que subirla
      if (imageUri && !imageUri.startsWith('http')) {
        console.log('Subiendo imagen local:', imageUri);
        finalImageUrl = await storageApi.uploadHabitImage(imageUri);
        console.log('Imagen subida con éxito:', finalImageUrl);
      }

      const data: HabitCreateData = {
        name,
        description: selectedCategory.label + (description ? ': ' + description : ''),
        icon: selectedCategory.icon,
        color: t.accent,
        frequency: 'daily',
        target_days: selectedDays,
        image_url: finalImageUrl || undefined,
      };

      if (habit && onUpdate) {
        onUpdate(habit.id, data);
      } else {
        onCreate(data);
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el hábito');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (!habit || !onDelete) return;
    Alert.alert(
      'Eliminar Hábito',
      '¿Estás seguro de que quieres eliminar este hábito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          onDelete(habit.id);
          onClose();
        }},
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.ink }]}>
                {habit ? 'Editar Hábito' : 'Nuevo Hábito'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeText, { color: t.muted }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll}>
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity onPress={pickImage} style={[styles.imageCircle, { backgroundColor: t.panel, borderColor: t.ring }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                  ) : (
                    <Text style={{ fontSize: 32 }}>📷</Text>
                  )}
                  <View style={[styles.editBadge, { backgroundColor: t.accent }]}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>EDITAR</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.imageLabel, { color: t.muted }]}>Foto del hábito (Opcional)</Text>
              </View>

              <Input
                label="NOMBRE DEL HÁBITO"
                placeholder="ej. Meditar"
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.sectionTitle, { color: t.muted }]}>CATEGORÍA</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.label}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryChip,
                      { 
                        backgroundColor: selectedCategory.label === cat.label ? t.accent : t.panel,
                        borderColor: t.ring
                      }
                    ]}
                  >
                    <Text style={[styles.categoryIcon]}>{cat.icon}</Text>
                    <Text 
                      style={[
                        styles.categoryLabel, 
                        { color: selectedCategory.label === cat.label ? '#fff' : t.ink }
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: t.muted }]}>REPETIR EN</Text>
              <View style={styles.daysContainer}>
                {DAYS.map(day => {
                  const isActive = selectedDays.includes(day.value);
                  return (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => toggleDay(day.value)}
                      style={[
                        styles.dayCircle,
                        { 
                          backgroundColor: isActive ? t.accent : t.panel,
                          borderColor: t.ring
                        }
                      ]}
                    >
                      <Text style={[styles.dayLabel, { color: isActive ? '#fff' : t.ink }]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
              
              <Button 
                title={habit ? 'Actualizar Hábito' : 'Crear Hábito'} 
                onPress={handleSave}
                disabled={!name.trim() || uploading}
              />
              
              {uploading && <ActivityIndicator style={{ marginTop: 12 }} color={t.accent} />}

              {habit && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Eliminar Hábito</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fonts.serif,
  },
  closeText: {
    fontSize: 16,
    fontFamily: typography.fonts.sans,
  },
  scroll: {
    flex: 1,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  imageLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: typography.fonts.sans,
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
  },
  deleteButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
  },
  deleteText: {
    color: '#c94242',
    fontFamily: typography.fonts.sans,
    fontSize: 15,
  },
});
