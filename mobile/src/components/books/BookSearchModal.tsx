import React, { useState, useCallback } from 'react';
import { 
  Modal, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, Image, ActivityIndicator, Pressable, ScrollView,
  LayoutAnimation, Platform, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { booksApi, BookSearchResult, BookStatus } from '../../api/books';
import { BookPreviewModal } from './BookPreviewModal';
import { debounce } from 'lodash';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LANG_OPTIONS = [
  { label: 'Español', value: 'es' },
  { label: 'Inglés', value: 'en' },
  { label: 'Todos los idiomas', value: 'all' },
];

interface BookSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBook: (book: BookSearchResult, status: BookStatus) => void;
}

export const BookSearchModal: React.FC<BookSearchModalProps> = ({ 
  visible, onClose, onAddBook 
}) => {
  const { t } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [lang, setLang] = useState('es');
  const [authorFilter, setAuthorFilter] = useState('');

  const searchBooks = async (text: string, searchLang: string, searchAuthor: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await booksApi.searchBooks(
        text, 
        searchLang, 
        searchAuthor.trim() || undefined
      );
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text: string, l: string, a: string) => searchBooks(text, l, a), 500),
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text, lang, authorFilter);
  };

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  const applyFilters = () => {
    setShowFilters(false);
    searchBooks(query, lang, authorFilter);
  };

  const resetFilters = () => {
    setLang('es');
    setAuthorFilter('');
    searchBooks(query, 'es', '');
  };

  const openPreview = (book: BookSearchResult) => {
    setSelectedBook(book);
    setPreviewVisible(true);
  };

  const renderItem = ({ item }: { item: BookSearchResult }) => (
    <Pressable 
      onPress={() => openPreview(item)}
      style={({ pressed }) => [
        styles.resultItem, 
        { borderBottomColor: t.ring, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={styles.resultCoverContainer}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.resultCover} />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: t.panel }]} />
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: t.ink }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.resultAuthor, { color: t.muted }]} numberOfLines={1}>
          {item.authors.join(', ')}
        </Text>
        {item.page_count > 0 && (
          <Text style={[styles.resultMeta, { color: t.muted }]}>
            {item.page_count} págs.{item.published_date && item.published_date !== '0000' ? ` · ${item.published_date}` : ''}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.ink }]}>Descubrimiento</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={[styles.closeText, { color: t.muted }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar with Filter Toggle */}
            <View style={styles.searchRow}>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Título, autor, ISBN..."
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

            {/* Dropdown-style Filter Menu */}
            {showFilters && (
              <View style={[styles.filterMenu, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <Text style={[styles.filterMenuTitle, { color: t.ink }]}>Filtros de búsqueda</Text>
                
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: t.muted }]}>Idioma</Text>
                  <View style={styles.optionsGrid}>
                    {LANG_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setLang(opt.value)}
                        style={[
                          styles.optionBtn,
                          { 
                            backgroundColor: lang === opt.value ? t.ink : 'transparent',
                            borderColor: t.ring
                          }
                        ]}
                      >
                        <Text style={[styles.optionText, { color: lang === opt.value ? t.bg : t.ink }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: t.muted }]}>Autor específico</Text>
                  <Input
                    placeholder="Ej: Tolkien"
                    value={authorFilter}
                    onChangeText={setAuthorFilter}
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

            {/* Results */}
            {loading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={t.accent} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.google_books_id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  query.trim() ? (
                    <Text style={[styles.emptyText, { color: t.muted }]}>No se han encontrado resultados.</Text>
                  ) : null
                }
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      <BookPreviewModal 
        visible={previewVisible}
        book={selectedBook}
        onClose={() => setPreviewVisible(false)}
        onAdd={(book, data) => {
          setPreviewVisible(false);
          onAddBook(book, data);
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
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 15,
    fontFamily: typography.fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ─── Filter Menu ────────────────────────
  filterMenu: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  filterMenuTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
    textDecorationLine: 'underline',
  },
  applyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.fonts.sans,
  },

  // ─── Results ────────────────────────────
  listContent: {
    paddingBottom: 40,
  },
  resultItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resultCoverContainer: {
    width: 56,
    height: 84,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#000',
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
    fontSize: 15,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
  },
  resultAuthor: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 11,
    fontFamily: typography.fonts.sans,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: typography.fonts.sans,
    fontSize: 14,
  },
});
