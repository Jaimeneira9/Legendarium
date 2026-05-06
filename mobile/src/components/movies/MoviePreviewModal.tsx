import React from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { MovieSearchResult, MovieStatus } from '../../api/movies';
import { Button, StarRating } from '../ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MoviePreviewModalProps {
  visible: boolean;
  movie: MovieSearchResult | null;
  onClose: () => void;
  onAdd: (movie: MovieSearchResult, data: any) => void;
}

export const MoviePreviewModal: React.FC<MoviePreviewModalProps> = ({
  visible, movie, onClose, onAdd
}) => {
  const { t } = useTheme();
  const [status, setStatus] = React.useState<MovieStatus>('want_to_watch');
  const [rating, setRating] = React.useState<number | null>(null);

  if (!movie) return null;

  const handleAdd = () => {
    onAdd(movie, {
      status,
      rating: rating || undefined,
      watched_at: status === 'watched' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: t.muted }]}>DESCUBRIMIENTO · PREVISUALIZACIÓN</Text>
                <Text style={[styles.title, { color: t.ink }]} numberOfLines={1}>
                  Detalles del Film
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={[styles.closeBtn, { borderColor: t.ring, backgroundColor: t.panel }]}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={{ color: t.ink, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.posterSection}>
                <View style={[styles.posterShadow, { shadowColor: '#000' }]}>
                  {movie.poster_url ? (
                    <Image source={{ uri: movie.poster_url }} style={styles.posterImg} />
                  ) : (
                    <View style={[styles.placeholderPoster, { backgroundColor: t.panel }]} />
                  )}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={[styles.movieTitle, { color: t.ink }]}>{movie.title}</Text>
                <Text style={[styles.movieYear, { color: t.muted }]}>
                  {movie.release_date ? movie.release_date.substring(0, 4) : 'Año desconocido'}
                  {movie.vote_average ? ` · ★ ${movie.vote_average.toFixed(1)}` : ''}
                </Text>

                <View style={styles.tagsRow}>
                  {movie.genres?.map((genre, idx) => (
                    <View key={idx} style={[styles.tag, { backgroundColor: t.panel, borderColor: t.ring }]}>
                      <Text style={[styles.tagText, { color: t.muted }]}>{genre.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>

                {movie.overview && (
                  <View style={styles.overviewBox}>
                    <Text style={[styles.sectionLabel, { color: t.muted }]}>SINOPSIS</Text>
                    <Text style={[styles.overview, { color: t.ink }]}>
                      {movie.overview}
                    </Text>
                  </View>
                )}

                <View style={[styles.divider, { backgroundColor: t.ring }]} />

                <View style={styles.actionSection}>
                  <Text style={[styles.sectionLabel, { color: t.muted }]}>AÑADIR A MI CARTELERA</Text>
                  
                  <View style={[styles.statusSelector, { backgroundColor: t.panel, borderColor: t.ring }]}>
                    {(['want_to_watch', 'watched'] as MovieStatus[]).map((s) => (
                      <TouchableOpacity 
                        key={s}
                        onPress={() => setStatus(s)}
                        style={[styles.statusOption, status === s && { backgroundColor: t.bg }]}
                      >
                        <Text style={[styles.statusOptionText, { color: status === s ? t.accent : t.muted }]}>
                          {s === 'want_to_watch' ? 'Quiero verla' : 'Ya la he visto'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {status === 'watched' && (
                    <View style={styles.ratingRow}>
                      <Text style={[styles.fieldLabel, { color: t.muted }]}>VALORACIÓN</Text>
                      <StarRating rating={rating} onChange={setRating} size={24} />
                    </View>
                  )}

                  <Button 
                    title={status === 'watched' ? "MARCAR COMO VISTA" : "AÑADIR A PENDIENTES"} 
                    onPress={handleAdd} 
                    style={{ marginTop: 16 }}
                  />
                </View>
              </View>
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
  content: { flex: 1, marginTop: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  eyebrow: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: typography.fonts.serif, fontWeight: '500' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60 },
  posterSection: { alignItems: 'center', paddingVertical: 24 },
  posterShadow: {
    width: 180,
    height: 270,
    borderRadius: 8,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  posterImg: { width: '100%', height: '100%', borderRadius: 8 },
  placeholderPoster: { width: '100%', height: '100%', borderRadius: 8 },
  infoSection: { paddingHorizontal: 24 },
  movieTitle: { fontSize: 28, fontFamily: typography.fonts.serif, fontWeight: '500', lineHeight: 32, textAlign: 'center', marginBottom: 8 },
  movieYear: { fontSize: 15, fontFamily: typography.fonts.sans, textAlign: 'center', marginBottom: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 32 },
  tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  tagText: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 0.5 },
  overviewBox: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1.2, marginBottom: 16 },
  overview: { fontSize: 15, fontFamily: typography.fonts.sans, lineHeight: 24, opacity: 0.8 },
  divider: { height: 1, marginBottom: 24, opacity: 0.5 },
  actionSection: { marginTop: 0 },
  statusSelector: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  statusOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  statusOptionText: { fontSize: 12, fontFamily: typography.fonts.sans, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 0.5 },
});
