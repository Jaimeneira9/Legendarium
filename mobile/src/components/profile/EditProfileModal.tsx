import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Input, Button } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { authApi, User } from '../../api/auth';
import { storageApi } from '../../api/storage';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  user: User | null;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  visible, onClose, onUpdate, user 
}) => {
  const { t } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [goal, setGoal] = useState('');
  const [movieGoal, setMovieGoal] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setGoal(user.annual_reading_goal?.toString() || '0');
      setMovieGoal(user.annual_movie_goal?.toString() || '0');
      setImageUri(user.avatar_url || null);
    }
  }, [user, visible]);

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
    setLoading(true);
    try {
      let finalAvatarUrl = imageUri;

      if (imageUri && !imageUri.startsWith('http') && user?.id) {
        finalAvatarUrl = await storageApi.uploadAvatar(imageUri, user.id);
      }

      await authApi.updateMe({
        display_name: displayName,
        bio: bio,
        annual_reading_goal: parseInt(goal) || 0,
        annual_movie_goal: parseInt(movieGoal) || 0,
        avatar_url: finalAvatarUrl || undefined
      });

      onUpdate();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.ink }]}>Editar Perfil</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeText, { color: t.muted }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll}>
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity onPress={pickImage} style={[styles.imageCircle, { backgroundColor: t.panel, borderColor: t.ring }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 32 }}>👤</Text>
                  )}
                  <View style={[styles.editBadge, { backgroundColor: t.accent }]}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>CAMBIAR</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[styles.imageLabel, { color: t.muted }]}>Foto de Perfil</Text>
              </View>

              <Input
                label="NOMBRE A MOSTRAR"
                placeholder="Tu nombre"
                value={displayName}
                onChangeText={setDisplayName}
              />

              <Input
                label="BIOGRAFÍA / CITA"
                placeholder="Tu frase favorita..."
                value={bio}
                onChangeText={setBio}
                multiline
              />

              <Input
                label="META DE LECTURA ANUAL"
                placeholder="ej: 12"
                value={goal}
                onChangeText={setGoal}
                keyboardType="number-pad"
              />

              <Input
                label="META DE PELÍCULAS"
                placeholder="50"
                value={movieGoal}
                onChangeText={setMovieGoal}
                keyboardType="number-pad"
              />

              <View style={{ height: 40 }} />
              
              <Button 
                title="GUARDAR CAMBIOS" 
                onPress={handleSave}
                loading={loading}
              />
              
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  safeArea: { flex: 1 },
  content: { flex: 1, marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontFamily: typography.fonts.serif },
  closeText: { fontSize: 16, fontFamily: typography.fonts.sans },
  scroll: { flex: 1 },
  imagePickerContainer: { alignItems: 'center', marginBottom: 24 },
  imageCircle: { width: 100, height: 100, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  selectedImage: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 0, width: '100%', height: 24, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  imageLabel: { fontSize: 12, fontFamily: typography.fonts.sans },
});
