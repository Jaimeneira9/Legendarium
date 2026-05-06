import React, { useState, useCallback } from 'react';
import { 
  Modal, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, Image, ActivityIndicator, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { moviesApi, MovieSearchResult, MovieStatus } from '../../api/movies';
import { debounce } from 'lodash';
import { MoviePreviewModal } from './MoviePreviewModal';

interface MovieSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMovie: (movie: MovieSearchResult, data: any) => void;
}

export const MovieSearchModal: React.FC<MovieSearchModalProps> = ({ 
  visible, onClose, onAddMovie 
}) => {
  const { t } = useTheme();
  const [yearFilter, setYearFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const searchMovies = async (text: string, year?: string) => {
    if (!text.trim() && !year) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const yearNum = year ? parseInt(year) : undefined;
      const data = await moviesApi.searchMovies(text, yearNum);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text: string, year: string) => searchMovies(text, year), 500),
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text, yearFilter);
  };

  const toggleFilters = () => setShowFilters(!showFilters);

  const applyFilters = () => {
    setShowFilters(false);
    searchMovies(query, yearFilter);
  };

  const resetFilters = () => {
    setYearFilter('');
    setShowFilters(false);
    searchMovies(query, '');
  };

  const openPreview = (movie: MovieSearchResult) => {
    setSelectedMovie(movie);
    setPreviewVisible(true);
  };

  const renderItem = ({ item }: { item: MovieSearchResult }) => (
    <Pressable 
      onPress={() => openPreview(item)}
      style={({ pressed }) => [
        styles.resultItem, 
        { borderBottomColor: t.ring, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={styles.resultCoverContainer}>
        {item.poster_url ? (
          <Image source={{ uri: item.poster_url }} style={styles.resultCover} />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: t.panel }]} />
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: t.ink }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.resultAuthor, { color: t.muted }]} numberOfLines={1}>
          {item.release_date ? item.release_date.substring(0, 4) : 'Año desconocido'}
        </Text>
        <View style={styles.viewBadge}>
          <Text style={[styles.viewBadgeText, { color: t.accent }]}>PULSA PARA PREVISUALIZAR</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.ink }]}>Descubrimiento</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeText, { color: t.muted }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Título, director..."
                  value={query}
                  onChangeText={handleQueryChange}
                  autoFocus
                />
              </View>
              <TouchableOpacity 
                onPress={toggleFilters}
                style={[
                  styles.filterBtn, 
                  { 
                    backgroundColor: showFilters ? t.ink : t.panel,
                    borderColor: t.ring 
                  }
                ]}
              >
                <Text style={{ fontSize: 18, color: showFilters ? t.bg : t.ink }}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* Dropdown Filter Menu */}
            {showFilters && (
              <View style={[styles.filterMenu, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <Text style={[styles.filterMenuTitle, { color: t.ink }]}>Filtros de cine</Text>
                
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: t.muted }]}>Año de estreno</Text>
                  <Input
                    placeholder="Ej: 1994"
                    value={yearFilter}
                    onChangeText={setYearFilter}
                    keyboardType="numeric"
                    maxLength={4}
                    style={{ backgroundColor: t.bg }}
                  />
                </View>

                <View style={styles.filterActions}>
                  <TouchableOpacity onPress={resetFilters}>
                    <Text style={[styles.resetText, { color: t.muted }]}>Limpiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={applyFilters}
                    style={[styles.applyBtn, { backgroundColor: t.accent }]}
                  >
                    <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {loading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={t.accent} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.tmdb_id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  query.trim() || yearFilter ? (
                    <Text style={[styles.emptyText, { color: t.muted }]}>No se han encontrado películas para esta búsqueda.</Text>
                  ) : null
                }
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      <MoviePreviewModal 
        visible={previewVisible}
        movie={selectedMovie}
        onClose={() => setPreviewVisible(false)}
        onAdd={(movie, data) => {
          setPreviewVisible(false);
          onAddMovie(movie, data);
        }}
      />
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
    fontWeight: '500',
  },
  closeText: {
    fontSize: 16,
    fontFamily: typography.fonts.sans,
    fontWeight: '500',
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterMenu: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
  },
  filterMenuTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 10,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  resultItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resultCoverContainer: {
    width: 60,
    height: 90,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 16,
  },
  resultCover: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultAuthor: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    marginBottom: 8,
  },
  viewBadge: {
    marginTop: 4,
  },
  viewBadgeText: {
    fontSize: 9,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: typography.fonts.sans,
  },
});
