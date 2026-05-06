import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  RefreshControl, TouchableOpacity, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ScreenHeader, EmptyState, ProgressBar } from '@/components/ui';
import { MovieDetailModal } from '@/components/movies/MovieDetailModal';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { moviesApi, UserMovie } from '@/api/movies';
import { MediaSearchModal } from '@/components/media/MediaSearchModal';
import { SeriesDetailModal } from '@/components/series/SeriesDetailModal';
import { seriesApi, UserSeriesResponse } from '@/api/series';
import { TouchableScale } from '@/components/ui/TouchableScale';

const PAGE_SIZE = 20;

// Filtros compartidos para series. Películas solo tiene "Vistas" y "Por ver".
const MOVIE_FILTERS: { label: string; value: string }[] = [
  { label: 'Vistas', value: 'watched' },
  { label: 'Por ver', value: 'want_to_watch' },
];

const SERIES_FILTERS: { label: string; value: string }[] = [
  { label: 'En curso', value: 'watching' },
  { label: 'Por ver', value: 'want_to_watch' },
  { label: 'Terminadas', value: 'finished' },
];

type MediaType = 'movies' | 'series';

export default function MoviesScreen() {
  const { t } = useTheme();
  const queryClient = useQueryClient();
  
  // Media type tab
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('movies');
  const [activeFilter, setActiveFilter] = useState<string>('watched');

  // Pagination state for movies
  const [movies, setMovies] = useState<UserMovie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isRefreshingMovies, setIsRefreshingMovies] = useState(false);
  const [isFetchingMoreMovies, setIsFetchingMoreMovies] = useState(false);
  const [hasMoreMovies, setHasMoreMovies] = useState(true);
  const movieOffsetRef = useRef(0);

  // Pagination state for series
  const [series, setSeries] = useState<UserSeriesResponse[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [isRefreshingSeries, setIsRefreshingSeries] = useState(false);
  const [isFetchingMoreSeries, setIsFetchingMoreSeries] = useState(false);
  const [hasMoreSeries, setHasMoreSeries] = useState(true);
  const seriesOffsetRef = useRef(0);

  // Modals
  const [searchVisible, setSearchVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // ─── Fetchers — Películas ─────────────────────────────────────────

  const loadFirstMovies = useCallback(async (filter: string) => {
    setIsLoadingMovies(true);
    setHasMoreMovies(true);
    movieOffsetRef.current = 0;
    try {
      const data = await moviesApi.getMyMovies(filter, PAGE_SIZE, 0);
      setMovies(data);
      setHasMoreMovies(data.length === PAGE_SIZE);
      movieOffsetRef.current = data.length;
    } catch (err) {
      console.error('Error loading movies:', err);
    } finally {
      setIsLoadingMovies(false);
    }
  }, []);

  const loadMoreMovies = useCallback(async () => {
    if (isFetchingMoreMovies || !hasMoreMovies) return;
    setIsFetchingMoreMovies(true);
    try {
      const data = await moviesApi.getMyMovies(activeFilter, PAGE_SIZE, movieOffsetRef.current);
      if (data.length > 0) {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const filtered = data.filter(m => !existingIds.has(m.id));
          return [...prev, ...filtered];
        });
        movieOffsetRef.current += data.length;
      }
      setHasMoreMovies(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more movies:', err);
    } finally {
      setIsFetchingMoreMovies(false);
    }
  }, [activeFilter, isFetchingMoreMovies, hasMoreMovies]);

  const refreshMovies = useCallback(async () => {
    setIsRefreshingMovies(true);
    movieOffsetRef.current = 0;
    setHasMoreMovies(true);
    try {
      const data = await moviesApi.getMyMovies(activeFilter, PAGE_SIZE, 0);
      setMovies(data);
      setHasMoreMovies(data.length === PAGE_SIZE);
      movieOffsetRef.current = data.length;
    } catch (err) {
      console.error('Error refreshing movies:', err);
    } finally {
      setIsRefreshingMovies(false);
    }
  }, [activeFilter]);

  // ─── Fetchers — Series ────────────────────────────────────────────

  const loadFirstSeries = useCallback(async (filter: string) => {
    setIsLoadingSeries(true);
    setHasMoreSeries(true);
    seriesOffsetRef.current = 0;
    try {
      const data = await seriesApi.getMySeries(filter, PAGE_SIZE, 0);
      setSeries(data);
      setHasMoreSeries(data.length === PAGE_SIZE);
      seriesOffsetRef.current = data.length;
    } catch (err) {
      console.error('Error loading series:', err);
    } finally {
      setIsLoadingSeries(false);
    }
  }, []);

  const loadMoreSeries = useCallback(async () => {
    if (isFetchingMoreSeries || !hasMoreSeries) return;
    setIsFetchingMoreSeries(true);
    try {
      const data = await seriesApi.getMySeries(activeFilter, PAGE_SIZE, seriesOffsetRef.current);
      if (data.length > 0) {
        setSeries(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const filtered = data.filter(s => !existingIds.has(s.id));
          return [...prev, ...filtered];
        });
        seriesOffsetRef.current += data.length;
      }
      setHasMoreSeries(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more series:', err);
    } finally {
      setIsFetchingMoreSeries(false);
    }
  }, [activeFilter, isFetchingMoreSeries, hasMoreSeries]);

  const refreshSeries = useCallback(async () => {
    setIsRefreshingSeries(true);
    seriesOffsetRef.current = 0;
    setHasMoreSeries(true);
    try {
      const data = await seriesApi.getMySeries(activeFilter, PAGE_SIZE, 0);
      setSeries(data);
      setHasMoreSeries(data.length === PAGE_SIZE);
      seriesOffsetRef.current = data.length;
    } catch (err) {
      console.error('Error refreshing series:', err);
    } finally {
      setIsRefreshingSeries(false);
    }
  }, [activeFilter]);

  // ─── Event Handlers ───────────────────────────────────────────────

  /** Cambia el filtro de estado y recarga la primera página del tipo activo. */
  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeMediaType === 'movies') {
      loadFirstMovies(filter);
    } else {
      loadFirstSeries(filter);
    }
  }, [activeMediaType, loadFirstMovies, loadFirstSeries]);

  /** Cambia entre Películas y Series y carga la primera página del nuevo tipo. */
  const handleMediaTypeChange = useCallback((type: MediaType) => {
    setActiveMediaType(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const defaultFilter = type === 'movies' ? 'watched' : 'watching';
    setActiveFilter(defaultFilter);
    if (type === 'movies') {
      loadFirstMovies(defaultFilter);
    } else {
      loadFirstSeries(defaultFilter);
    }
  }, [loadFirstMovies, loadFirstSeries]);

  const handleAddItem = async (item: any, data: any) => {
    try {
      if (activeMediaType === 'movies') {
        await moviesApi.addMovie({ tmdb_id: item.tmdb_id, ...data });
        loadFirstMovies(activeFilter);
      } else {
        await seriesApi.addSeries({ tmdb_id: item.tmdb_id, ...data });
        loadFirstSeries(activeFilter);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSearchVisible(false);
    } catch (error) {
      console.error('Add item error:', error);
    }
  };

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  // Carga inicial solo de películas; series se carga al cambiar de pestaña
  React.useEffect(() => {
    loadFirstMovies('watched');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render helpers ───────────────────────────────────────────────

  const mediaList = activeMediaType === 'movies' ? movies : series;
  const isLoading = activeMediaType === 'movies' ? isLoadingMovies : isLoadingSeries;
  const isRefreshing = activeMediaType === 'movies' ? isRefreshingMovies : isRefreshingSeries;
  const isFetchingMore = activeMediaType === 'movies' ? isFetchingMoreMovies : isFetchingMoreSeries;
  const onRefresh = activeMediaType === 'movies' ? refreshMovies : refreshSeries;
  const onEndReached = activeMediaType === 'movies' ? loadMoreMovies : loadMoreSeries;
  const currentFilters = activeMediaType === 'movies' ? MOVIE_FILTERS : SERIES_FILTERS;

  const getAbsoluteEpisode = (item: any) => {
    if (!item.seasons_data || item.seasons_data.length === 0) return item.current_episode;
    let absolute = 0;
    const sortedSeasons = [...item.seasons_data].sort((a: any, b: any) => a.season_number - b.season_number);
    for (const s of sortedSeasons) {
      if (s.season_number < item.current_season) {
        absolute += s.episode_count;
      } else if (s.season_number === item.current_season) {
        absolute += item.current_episode;
        break;
      }
    }
    return absolute;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={{ paddingHorizontal: 24 }}>
        <ScreenHeader 
          eyebrow="MI" 
          title="Cartelera" 
          trailing={
            <TouchableOpacity 
              onPress={() => setSearchVisible(true)}
              style={[styles.searchBtn, { backgroundColor: t.panel, borderColor: t.ring }]}
            >
              <Text style={{ color: t.ink, fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Tabs: Películas / Series */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => handleMediaTypeChange('movies')}
          style={[styles.tab, activeMediaType === 'movies' && { borderBottomColor: t.accent }]}
        >
          <Text style={[styles.tabText, { color: activeMediaType === 'movies' ? t.ink : t.muted }]}>Películas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleMediaTypeChange('series')}
          style={[styles.tab, activeMediaType === 'series' && { borderBottomColor: t.accent }]}
        >
          <Text style={[styles.tabText, { color: activeMediaType === 'series' ? t.ink : t.muted }]}>Series & Anime</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de estado */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {currentFilters.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => handleFilterChange(f.value)}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: activeFilter === f.value ? t.ink : 'transparent',
                  borderColor: activeFilter === f.value ? t.ink : t.ring
                }
              ]}
            >
              <Text style={[styles.filterLabel, { color: activeFilter === f.value ? t.bg : t.muted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={t.accent} size="small" />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <FlatList
        data={mediaList}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const absEp = activeMediaType === 'series' ? getAbsoluteEpisode(item) : 0;
          const progress = item.total_episodes ? (absEp / item.total_episodes) : 0;
          
          return (
            <View style={styles.gridItem}>
               <TouchableScale 
                 onPress={() => openDetail(item)}
                 haptic="light"
                 scaleTo={0.95}
               >
                  <View style={[styles.gridPoster, { shadowColor: '#000' }]}>
                    {item.poster_url ? (
                      <Image source={{ uri: item.poster_url }} style={styles.gridImg} />
                    ) : (
                      <View style={[styles.gridImg, { backgroundColor: t.panel }]} />
                    )}
                    
                    {activeMediaType === 'series' && item.status === 'watching' && (
                      <View style={styles.progressOverlay}>
                        <ProgressBar progress={progress} height={3} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.gridTitle, { color: t.ink }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.gridYear, { color: t.muted }]} numberOfLines={1}>
                    {activeMediaType === 'series' && item.status === 'watching' 
                      ? `E${item.current_episode} / T${item.current_season}`
                      : (item.release_date ? item.release_date.substring(0, 4) : 'N/A')}
                  </Text>
               </TouchableScale>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState 
              icon={activeMediaType === 'movies' ? "🎬" : "📺"}
              title="Tu colección está vacía"
              description={`Añade ${activeMediaType === 'movies' ? 'películas' : 'series o animes'} para empezar tu seguimiento.`}
              actionLabel={`Buscar ${activeMediaType === 'movies' ? 'película' : 'serie'}`}
              onAction={() => setSearchVisible(true)}
            />
          ) : null
        }
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
      />
      
      {isLoading && !isRefreshing && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.bg, opacity: 0.6 }]}>
          <ActivityIndicator color={t.accent} size="large" />
        </View>
      )}

      <MediaSearchModal 
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onAddMedia={handleAddItem}
        initialType={activeMediaType}
      />

      {activeMediaType === 'movies' ? (
        <MovieDetailModal
          visible={detailVisible}
          movie={selectedItem}
          onClose={() => {
            setDetailVisible(false);
            setSelectedItem(null);
          }}
          onUpdate={() => loadFirstMovies(activeFilter)}
          onDelete={() => loadFirstMovies(activeFilter)}
        />
      ) : (
        <SeriesDetailModal
          visible={detailVisible}
          series={selectedItem}
          onClose={() => {
            setDetailVisible(false);
            setSelectedItem(null);
          }}
          onUpdate={() => loadFirstSeries(activeFilter)}
          onDelete={() => loadFirstSeries(activeFilter)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterWrapper: {
    marginBottom: 20,
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 20,
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  listContent: {
    paddingBottom: 40,
  },
  gridItem: {
    flex: 1/3,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  gridPoster: {
    aspectRatio: 2/3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#000',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridTitle: {
    fontSize: 12,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 1,
  },
  gridYear: {
    fontSize: 10,
    fontFamily: typography.fonts.sans,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
