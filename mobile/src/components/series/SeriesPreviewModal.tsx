import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, Image, 
  TouchableOpacity, ScrollView 
} from 'react-native';
import { SeriesSearchResult } from '@/api/series';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { StarRating } from '../ui/StarRating';

interface SeriesPreviewModalProps {
  visible: boolean;
  series: SeriesSearchResult;
  onClose: () => void;
  onAdd: (series: SeriesSearchResult, data: any) => void;
}

type SeriesStatus = 'want_to_watch' | 'watching' | 'watched' | 'dropped';

export const SeriesPreviewModal: React.FC<SeriesPreviewModalProps> = ({ 
  visible, series, onClose, onAdd 
}) => {
  const { t } = useTheme();
  const [status, setStatus] = useState<SeriesStatus>('watching');
  const [rating, setRating] = useState<number | null>(null);

  const handleAdd = () => {
    onAdd(series, {
      status,
      rating: status === 'watched' ? rating : undefined,
      last_watched_at: status === 'watched' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: t.bg }]}>
          <ScrollView>
            <View style={styles.header}>
              {series.poster_url ? (
                <Image source={{ uri: series.poster_url }} style={styles.poster} />
              ) : (
                <View style={[styles.poster, { backgroundColor: t.panel }]} />
              )}
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: t.ink }]}>{series.title}</Text>
                <Text style={[styles.year, { color: t.muted }]}>
                  {series.release_date ? series.release_date.split('-')[0] : 'N/A'}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: t.muted }]}>¿Cuál es tu plan?</Text>
            <View style={styles.statusGrid}>
              {(['watching', 'want_to_watch', 'watched'] as SeriesStatus[]).map((s) => (
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
                  <Text style={[
                    styles.statusText, 
                    { color: status === s ? t.bg : t.ink }
                  ]}>
                    {s === 'watching' ? 'Viendo' : s === 'want_to_watch' ? 'Por ver' : 'Visto'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {status === 'watched' && (
              <View style={styles.ratingSection}>
                <Text style={[styles.sectionTitle, { color: t.muted }]}>Tu valoración</Text>
                <StarRating rating={rating || 0} onChange={setRating} size={32} />
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { borderColor: t.ring }]} 
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: t.muted }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: t.accent }]}
                onPress={handleAdd}
              >
                <Text style={styles.confirmText}>Añadir a Cartelera</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 4,
  },
  year: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
