import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, Alert, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StarRating } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { moviesApi, UserMovie, MovieStatus, UserMovieUpdate } from '../../api/movies';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface MovieDetailModalProps {
  visible: boolean;
  movie: UserMovie | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const STATUS_OPTIONS: { label: string; value: MovieStatus }[] = [
  { label: 'Por ver', value: 'want_to_watch' },
  { label: 'Vista', value: 'watched' },
  { label: 'Abandonada', value: 'dropped' },
];

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ 
  visible, movie, onClose, onUpdate, onDelete 
}) => {
  const { t, isDark } = useTheme();
  const [status, setStatus] = useState<MovieStatus>('want_to_watch');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [watchedAt, setWatchedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (movie) {
      setStatus(movie.status);
      setRating(movie.rating || null);
      setNotes(movie.notes || '');
      setWatchedAt(movie.watched_at ? new Date(movie.watched_at) : null);
    }
  }, [movie, visible]);

  const handleStatusChange = (newStatus: MovieStatus) => {
    setStatus(newStatus);
    const today = new Date();
    
    if (newStatus === 'watched') {
      setWatchedAt(today);
    }
  };

  const handleSave = async () => {
    if (!movie) return;
    setLoading(true);
    try {
      const data: UserMovieUpdate = {
        status,
        rating: rating || undefined,
        notes: notes || undefined,
        watched_at: watchedAt ? watchedAt.toISOString().split('T')[0] : undefined,
      };
      await moviesApi.updateMovie(movie.id, data);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'No se pudo actualizar la película');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!movie) return;
    Alert.alert(
      'Eliminar Película',
      '¿Estás seguro de que quieres eliminar esta película de tu colección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await moviesApi.deleteMovie(movie.id);
            onDelete();
            onClose();
          } catch (error) {
            console.error('Delete error:', error);
          }
        }},
      ]
    );
  };

  if (!movie) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: t.accent }]}>
                  DIARIO DE CINE
                </Text>
                <Text style={[styles.title, { color: t.ink }]} numberOfLines={1}>
                  Detalles de la Película
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={[styles.closeCircle, { borderColor: t.ring }]}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={{ color: t.ink, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.mainInfo}>
                 <View style={[styles.posterShadow, { shadowColor: '#000' }]}>
                    {movie.poster_url ? (
                      <Image source={{ uri: movie.poster_url }} style={styles.detailPoster} />
                    ) : (
                      <View style={[styles.detailPoster, { backgroundColor: t.panel }]} />
                    )}
                 </View>
                 <View style={styles.titleBlock}>
                    <Text style={[styles.detailTitle, { color: t.ink }]}>{movie.title}</Text>
                    <Text style={[styles.detailYear, { color: t.muted }]}>
                      {movie.release_date ? movie.release_date.substring(0, 4) : 'Desconocido'}
                    </Text>
                 </View>
              </View>

              <View style={styles.archiveActions}>
                 <Text style={[styles.sectionLabel, { color: t.muted }]}>ESTADO</Text>
                 <View style={styles.statusGrid}>
                    {STATUS_OPTIONS.map(opt => (
                      <TouchableOpacity 
                        key={opt.value}
                        onPress={() => handleStatusChange(opt.value)}
                        style={[styles.statusChip, { 
                          backgroundColor: status === opt.value ? t.ink : 'transparent',
                          borderColor: status === opt.value ? t.ink : t.ring
                        }]}
                      >
                        <Text style={[styles.statusLabel, { color: status === opt.value ? t.bg : t.muted }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                 </View>

                 {status === 'watched' && (
                   <View style={[styles.archiveDates, { marginTop: 24 }]}>
                      <View style={styles.dateBox}>
                        <Text style={[styles.dateLabel, { color: t.muted }]}>VISTA EL</Text>
                        <DateTimePicker
                          value={watchedAt || new Date()}
                          mode="date"
                          display="compact"
                          accentColor={t.accent}
                          themeVariant={isDark ? 'dark' : 'light'}
                          onChange={(event, date) => date && setWatchedAt(date)}
                          style={styles.nativePicker}
                        />
                      </View>
                   </View>
                 )}
              </View>

              {status === 'watched' && (
                <View style={styles.ratingSection}>
                   <Text style={[styles.sectionLabel, { color: t.muted }]}>VALORACIÓN</Text>
                   <StarRating rating={rating} onChange={setRating} size={32} />
                </View>
              )}

              <View style={styles.marginaliaSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: t.muted }]}>RESEÑA Y NOTAS</Text>
                  <Text style={[styles.noteDate, { color: t.muted }]}>Reflexiones personales</Text>
                </View>
                <View style={[styles.notesContainer, { backgroundColor: t.panel, borderColor: t.ring }]}>
                   <TextInput
                      style={[styles.notesInput, { color: t.ink }]}
                      multiline
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Pensamientos, sentimientos, críticas..."
                      placeholderTextColor="#a09a8e"
                   />
                </View>
              </View>

              <View style={styles.footerActions}>
                <Button 
                  title="GUARDAR DIARIO" 
                  onPress={handleSave} 
                  loading={loading}
                />
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Eliminar de la colección</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
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
  content: { flex: 1, marginTop: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  eyebrow: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: typography.fonts.serif, fontWeight: '500' },
  closeCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  mainInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  posterShadow: {
    width: 90,
    height: 135,
    borderRadius: 6,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  detailPoster: { width: '100%', height: '100%', borderRadius: 6 },
  titleBlock: { flex: 1, marginLeft: 24 },
  detailTitle: { fontSize: 20, fontFamily: typography.fonts.serif, fontWeight: '500', lineHeight: 24, marginBottom: 8 },
  detailYear: { fontSize: 15, fontFamily: typography.fonts.sans },
  archiveActions: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1.2, marginBottom: 16 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusLabel: { fontSize: 13, fontFamily: typography.fonts.sans, fontWeight: '500' },
  archiveDates: { flexDirection: 'row', justifyContent: 'space-between' },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 9, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  nativePicker: { 
    alignSelf: 'flex-start',
    marginLeft: -8, 
  },
  marginaliaSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  noteDate: { fontSize: 11, fontStyle: 'italic' },
  notesContainer: { padding: 16, borderRadius: 16, borderWidth: 1, minHeight: 150 },
  notesInput: { fontSize: 15, fontFamily: typography.fonts.sans, lineHeight: 22, textAlignVertical: 'top' },
  ratingSection: { marginBottom: 32 },
  starsRow: { flexDirection: 'row', gap: 12 },
  star: { fontSize: 32 },
  footerActions: { marginTop: 8 },
  deleteBtn: { marginTop: 20, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: '#c94242', fontSize: 14, fontFamily: typography.fonts.sans, fontWeight: '500' },
});
