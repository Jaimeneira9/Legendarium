import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, TextInput, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { seriesApi, UserSeriesResponse } from '@/api/series';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { StarRating } from '../ui/StarRating';
import { ProgressBar } from '../ui/ProgressBar';

interface SeriesDetailModalProps {
  visible: boolean;
  series: UserSeriesResponse | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  visible, series, onClose, onUpdate, onDelete
}) => {
  const { t } = useTheme();
  const [status, setStatus] = useState(series?.status || 'want_to_watch');
  const [rating, setRating] = useState(series?.rating || 0);
  const [currentSeason, setCurrentSeason] = useState(series?.current_season || 1);
  const [currentEpisode, setCurrentEpisode] = useState(series?.current_episode || 0);
  const [notes, setNotes] = useState(series?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (series) {
      setStatus(series.status);
      setRating(series.rating || 0);
      setCurrentSeason(series.current_season);
      setCurrentEpisode(series.current_episode);
      setNotes(series.notes || '');
    }
  }, [series]);

  if (!series) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await seriesApi.updateSeries(series.id, {
        status,
        rating: rating || undefined,
        current_season: currentSeason,
        current_episode: currentEpisode,
        notes,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update series error:', error);
      Alert.alert('Error', 'No se pudo actualizar la serie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar serie',
      '¿Estás seguro de que quieres eliminar esta serie de tu cartelera?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await seriesApi.deleteSeries(series.id);
            onDelete();
            onClose();
          }
        }
      ]
    );
  };

  const getAbsoluteEpisode = (season: number, episode: number) => {
    if (!series.seasons_data || series.seasons_data.length === 0) return episode;
    let absolute = 0;
    // Ordenar temporadas por número por si acaso
    const sortedSeasons = [...series.seasons_data].sort((a, b) => a.season_number - b.season_number);
    
    for (const s of sortedSeasons) {
      if (s.season_number < season) {
        absolute += s.episode_count;
      } else if (s.season_number === season) {
        absolute += episode;
        break;
      }
    }
    return absolute;
  };

  const absoluteEpisode = getAbsoluteEpisode(currentSeason, currentEpisode);
  const progress = series.total_episodes > 0 
    ? (absoluteEpisode / series.total_episodes) 
    : 0;

  const currentSeasonInfo = series.seasons_data?.find(s => s.season_number === currentSeason);
  const episodesInThisSeason = currentSeasonInfo?.episode_count || 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: t.muted, fontSize: 16 }}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={{ color: t.accent, fontSize: 16, fontWeight: 'bold' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Image source={{ uri: series.poster_url }} style={styles.poster} />
            <View style={styles.heroText}>
              <Text style={[styles.title, { color: t.ink }]}>{series.title}</Text>
              <Text style={[styles.info, { color: t.muted }]}>
                {series.total_seasons} Temporadas • {series.total_episodes} Episodios
              </Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusLabel, { color: t.accent, borderColor: t.accent }]}>
                  {status === 'watching' ? 'Viendo' : status === 'watched' ? 'Visto' : 'Por ver'}
                </Text>
              </View>
              {series.episode_run_time > 0 && absoluteEpisode > 0 && (
                <Text style={[styles.timeSpent, { color: t.muted }]}>
                  Tiempo invertido: {formatTime(absoluteEpisode * series.episode_run_time)}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.section, { borderTopColor: t.ring }]}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>Progreso de la serie</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressText, { color: t.ink }]}>
                  {Math.round(progress * 100)}% Completado
                </Text>
                <Text style={[styles.progressPercent, { color: t.muted }]}>
                  {absoluteEpisode} / {series.total_episodes} eps
                </Text>
              </View>
              <ProgressBar progress={progress} height={8} />
              
              <View style={styles.controls}>
                <View style={styles.controlGroup}>
                  <Text style={[styles.controlLabel, { color: t.muted }]}>Temporada</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity 
                      onPress={() => {
                        const newSeason = Math.max(1, currentSeason - 1);
                        setCurrentSeason(newSeason);
                        // Ajustar episodio si el actual supera el máximo de la temporada anterior
                        const prevSeasonInfo = series.seasons_data?.find(s => s.season_number === newSeason);
                        if (prevSeasonInfo && currentEpisode > prevSeasonInfo.episode_count) {
                          setCurrentEpisode(prevSeasonInfo.episode_count);
                        }
                      }}
                      style={[styles.stepBtn, { borderColor: t.ring }]}
                    >
                      <Text style={{ color: t.ink }}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepValue, { color: t.ink }]}>{currentSeason}</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        const newSeason = Math.min(series.total_seasons, currentSeason + 1);
                        setCurrentSeason(newSeason);
                        // Al subir de temporada, si estábamos al final de la anterior, podríamos resetear
                        // pero por ahora lo dejamos para que el usuario elija.
                      }}
                      style={[styles.stepBtn, { borderColor: t.ring }]}
                    >
                      <Text style={{ color: t.ink }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={[styles.controlLabel, { color: t.muted }]}>Episodio</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity 
                      onPress={() => setCurrentEpisode(Math.max(0, currentEpisode - 1))}
                      style={[styles.stepBtn, { borderColor: t.ring }]}
                    >
                      <Text style={{ color: t.ink }}>-</Text>
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', minWidth: 60 }}>
                      <Text style={[styles.stepValue, { color: t.ink }]}>{currentEpisode}</Text>
                      <Text style={{ fontSize: 10, color: t.muted }}>de {episodesInThisSeason}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setCurrentEpisode(Math.min(episodesInThisSeason, currentEpisode + 1))}
                      style={[styles.stepBtn, { borderColor: t.ring }]}
                    >
                      <Text style={{ color: t.ink }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.section, { borderTopColor: t.ring }]}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>Valoración</Text>
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <StarRating rating={rating} onChange={setRating} size={36} />
            </View>
          </View>

          <View style={[styles.section, { borderTopColor: t.ring }]}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>Estado</Text>
            <View style={styles.statusGrid}>
              {['want_to_watch', 'watching', 'watched', 'dropped'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.statusBtn,
                    { 
                      backgroundColor: status === s ? t.ink : t.panel,
                      borderColor: status === s ? t.ink : t.ring
                    }
                  ]}
                >
                  <Text style={[styles.statusBtnText, { color: status === s ? t.bg : t.ink }]}>
                    {s === 'watching' ? 'Viendo' : s === 'watched' ? 'Visto' : s === 'want_to_watch' ? 'Por ver' : 'Abandonado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { borderTopColor: t.ring }]}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>Notas</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: t.panel, color: t.ink, borderColor: t.ring }]}
              multiline
              placeholder="Añade tus impresiones..."
              placeholderTextColor={t.muted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Eliminar de mi Cartelera</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  closeBtn: {},
  hero: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 20,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  timeSpent: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    padding: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  progressContainer: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  controlGroup: {
    alignItems: 'center',
    flex: 1,
  },
  controlLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesInput: {
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontFamily: typography.fonts.sans,
    textAlignVertical: 'top',
  },
  deleteBtn: {
    marginTop: 20,
    padding: 24,
    alignItems: 'center',
  },
  deleteText: {
    color: '#ff4444',
    fontWeight: '600',
  },
});
