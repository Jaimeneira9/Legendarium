import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  RefreshControl, TouchableOpacity, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenHeader, EmptyState } from '@/components/ui';
import { BookSearchModal } from '@/components/books/BookSearchModal';
import { BookDetailModal } from '@/components/books/BookDetailModal';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { booksApi, UserBook, BookStatus, BookSearchResult } from '@/api/books';
import * as Haptics from 'expo-haptics';
import { TouchableScale } from '@/components/ui/TouchableScale';

const PAGE_SIZE = 20;

const STATUS_FILTERS: { label: string; value: BookStatus }[] = [
  { label: 'Leyendo', value: 'reading' },
  { label: 'Por leer', value: 'want_to_read' },
  { label: 'Terminados', value: 'read' },
];

export default function BooksScreen() {
  const { t } = useTheme();
  const queryClient = useQueryClient();
  
  // Pagination state
  const [books, setBooks] = useState<UserBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  // UI state
  const [activeFilter, setActiveFilter] = useState<BookStatus>('reading');
  const [searchVisible, setSearchVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  // ─── Fetchers ─────────────────────────────────────────────────────

  /** Carga la primera página (reset completo). */
  const loadFirstPage = useCallback(async (filter: BookStatus) => {
    setIsLoading(true);
    setHasMore(true);
    offsetRef.current = 0;
    try {
      const data = await booksApi.getMyBooks(filter, PAGE_SIZE, 0);
      setBooks(data);
      setHasMore(data.length === PAGE_SIZE);
      offsetRef.current = data.length;
    } catch (err) {
      console.error('Error loading books:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Carga la siguiente página y acumula. */
  const loadNextPage = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const data = await booksApi.getMyBooks(activeFilter, PAGE_SIZE, offsetRef.current);
      if (data.length > 0) {
        setBooks(prev => {
          const existingIds = new Set(prev.map(b => b.id));
          const filtered = data.filter(b => !existingIds.has(b.id));
          return [...prev, ...filtered];
        });
        offsetRef.current += data.length;
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more books:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [activeFilter, isFetchingMore, hasMore]);

  /** Pull-to-refresh: recarga la primera página. */
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    offsetRef.current = 0;
    setHasMore(true);
    try {
      const data = await booksApi.getMyBooks(activeFilter, PAGE_SIZE, 0);
      setBooks(data);
      setHasMore(data.length === PAGE_SIZE);
      offsetRef.current = data.length;
    } catch (err) {
      console.error('Error refreshing books:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeFilter]);

  // Carga inicial y al cambiar filtro
  const handleFilterChange = useCallback((filter: BookStatus) => {
    setActiveFilter(filter);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadFirstPage(filter);
  }, [loadFirstPage]);

  // Carga inicial
  React.useEffect(() => {
    loadFirstPage(activeFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────

  const nowReading = books.find(b => b.status === 'reading');

  const filteredBooks = books.filter(b => {
    // El libro "leyendo ahora" sale en el hero, no en la grid
    if (activeFilter === 'reading') {
      return b.status === 'reading' && b.id !== nowReading?.id;
    }
    return b.status === activeFilter;
  });

  const handleAddBook = async (book: BookSearchResult, data: any) => {
    try {
      await booksApi.addBook({ google_books_id: book.google_books_id, ...data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSearchVisible(false);
      // Invalidar caché general y recargar primera página del filtro activo
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      loadFirstPage(activeFilter);
    } catch (error) {
      console.error('Add book error:', error);
    }
  };

  const openDetail = (book: UserBook) => {
    setSelectedBook(book);
    setDetailVisible(true);
  };

  // ─── Render ───────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={{ paddingHorizontal: 24 }}>
        <ScreenHeader 
          eyebrow="LA BIBLIOTECA" 
          title="Tus Estanterías" 
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

      {nowReading && activeFilter === 'reading' && (
        <TouchableScale 
          onPress={() => openDetail(nowReading)}
          style={[styles.heroCard, { backgroundColor: t.panel, borderColor: t.ring }]}
          haptic="light"
          scaleTo={0.98}
        >
          <View style={styles.heroCover}>
             {nowReading.cover_url ? (
               <Image source={{ uri: nowReading.cover_url }} style={styles.heroImg} />
             ) : (
               <View style={[styles.heroImg, { backgroundColor: t.bg }]} />
             )}
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroEyebrow, { color: t.accent }]}>LEYENDO AHORA</Text>
            <Text style={[styles.heroTitle, { color: t.ink }]} numberOfLines={2}>{nowReading.title}</Text>
            <Text style={[styles.heroAuthor, { color: t.muted }]}>{nowReading.authors[0]}</Text>
            
            <View style={styles.heroProgressRow}>
              <View style={[styles.heroProgressBar, { backgroundColor: t.ring }]}>
                <View 
                  style={[
                    styles.heroProgressFill, 
                    { 
                      backgroundColor: t.accent, 
                      width: `${(nowReading.current_page / (nowReading.page_count || 1)) * 100}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.heroPercent, { color: t.ink }]}>
                {Math.round((nowReading.current_page / (nowReading.page_count || 1)) * 100)}
                <Text style={{ fontSize: 10, color: t.muted }}>%</Text>
              </Text>
            </View>
          </View>
        </TouchableScale>
      )}

      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((f) => (
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

  /** Spinner que aparece al pie de la lista mientras carga más. */
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
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
             <TouchableScale 
               onPress={() => openDetail(item)}
               haptic="light"
               scaleTo={0.95}
             >
                <View style={[styles.gridCover, { shadowColor: '#000' }]}>
                  {item.cover_url ? (
                    <Image source={{ uri: item.cover_url }} style={styles.gridImg} />
                  ) : (
                    <View style={[styles.gridImg, { backgroundColor: t.panel }]} />
                  )}
                </View>
                <Text style={[styles.gridTitle, { color: t.ink }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.gridAuthor, { color: t.muted }]} numberOfLines={1}>{item.authors[0]}</Text>
             </TouchableScale>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState 
              icon={activeFilter === 'reading' ? '📚' : '📖'}
              title={activeFilter === 'reading' ? 'Tu estantería está vacía' : 'Aún no hay libros aquí'}
              description={activeFilter === 'reading' 
                ? 'Empieza tu viaje literario añadiendo el libro que tienes entre manos.' 
                : 'Esta sección espera ser llenada con tus próximas aventuras.'}
              actionLabel="Buscar un libro"
              onAction={() => setSearchVisible(true)}
            />
          ) : null
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={t.accent} 
          />
        }
      />
      
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.bg, opacity: 0.6 }]}>
          <ActivityIndicator color={t.accent} size="large" />
        </View>
      )}

      <BookSearchModal 
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onAddBook={handleAddBook}
      />

      <BookDetailModal
        visible={detailVisible}
        book={selectedBook}
        onClose={() => {
          setDetailVisible(false);
          setSelectedBook(null);
        }}
        onUpdate={() => loadFirstPage(activeFilter)}
        onDelete={() => loadFirstPage(activeFilter)}
      />
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
  heroCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 28,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCover: {
    width: 78,
    height: 115,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 18,
  },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 19,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 4,
  },
  heroAuthor: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    marginBottom: 14,
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroProgressBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
  },
  heroPercent: {
    fontSize: 13,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  filterWrapper: {
    marginBottom: 20,
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
  gridCover: {
    aspectRatio: 2/3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#000',
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
  gridAuthor: {
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
