import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, TextInput, FlatList, 
  TouchableOpacity, Image, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { seriesApi, SeriesSearchResult } from '@/api/series';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { SeriesPreviewModal } from './SeriesPreviewModal';

interface SeriesSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSeries: (series: SeriesSearchResult, data: any) => void;
}

export const SeriesSearchModal: React.FC<SeriesSearchModalProps> = ({ 
  visible, onClose, onAddSeries 
}) => {
  const { t } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SeriesSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesSearchResult | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await seriesApi.search(query);
      setResults(data);
    } catch (error) {
      console.error('Search series error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (series: SeriesSearchResult) => {
    setSelectedSeries(series);
    setPreviewVisible(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.ink }]}>Buscar Serie o Anime</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeBtn, { color: t.muted }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={[styles.input, { backgroundColor: t.panel, color: t.ink, borderColor: t.ring }]}
            placeholder="Nombre de la serie..."
            placeholderTextColor={t.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity 
            style={[styles.searchBtn, { backgroundColor: t.accent }]}
            onPress={handleSearch}
          >
            <Text style={styles.searchBtnText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.tmdb_id.toString()}
            contentContainerStyle={styles.resultsList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.resultItem, { borderColor: t.ring }]}
                onPress={() => handleSelect(item)}
              >
                {item.poster_url ? (
                  <Image source={{ uri: item.poster_url }} style={styles.poster} />
                ) : (
                  <View style={[styles.poster, { backgroundColor: t.panel }]} />
                )}
                <View style={styles.info}>
                  <Text style={[styles.itemTitle, { color: t.ink }]}>{item.title}</Text>
                  <Text style={[styles.itemYear, { color: t.muted }]}>
                    {item.release_date ? item.release_date.split('-')[0] : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {selectedSeries && (
          <SeriesPreviewModal
            visible={previewVisible}
            series={selectedSeries}
            onClose={() => setPreviewVisible(false)}
            onAdd={(series, data) => {
              setPreviewVisible(false);
              onAddSeries(series, data);
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  closeBtn: { fontSize: 16 },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: typography.fonts.sans,
  },
  searchBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: 'bold' },
  resultsList: { paddingHorizontal: 24, paddingBottom: 40 },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: { width: 60, height: 90 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemYear: { fontSize: 14 },
});
