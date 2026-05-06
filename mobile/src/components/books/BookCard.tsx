import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { UserBook } from '../../api/books';

interface BookCardProps {
  book: UserBook;
  onPress: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onPress }) => {
  const { t } = useTheme();

  const progress = book.progress_percentage 
    ? (book.progress_percentage / 100) 
    : (book.page_count ? (book.current_page / book.page_count) : 0);

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: t.panel,
          borderColor: t.ring,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <View style={styles.coverContainer}>
        {book.cover_url ? (
          <Image 
            source={{ uri: book.cover_url }} 
            style={styles.cover} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: t.bg }]}>
            <Text style={[styles.placeholderText, { color: t.muted }]}>NO COVER</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: t.ink }]} numberOfLines={2}>
            {book.title}
          </Text>
        </View>

        <Text style={[styles.author, { color: t.muted }]} numberOfLines={1}>
          {book.authors.join(', ')} {book.published_date ? `• ${book.published_date.substring(0, 4)}` : ''}
        </Text>

        <View style={styles.tagsRow}>
          {book.categories?.slice(0, 2).map((cat, idx) => (
            <View key={idx} style={[styles.tag, { backgroundColor: t.bg, borderColor: t.ring }]}>
              <Text style={[styles.tagText, { color: t.muted }]}>{cat.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          {book.status === 'reading' && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBarBg, { backgroundColor: t.ring }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      backgroundColor: t.accent,
                      width: `${Math.min(progress * 100, 100)}%` 
                    }
                  ]} 
                  />
              </View>
              <Text style={[styles.progressText, { color: t.muted }]}>
                {book.page_count ? `${book.current_page} / ${book.page_count} pág.` : `${Math.round(progress * 100)}%`} {book.page_count && `(${Math.round(progress * 100)}%)`}
              </Text>
            </View>
          )}

          {book.status === 'read' && (
            <View style={styles.metaRow}>
              {book.rating ? (
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingStar, { color: t.accent }]}>★</Text>
                  <Text style={[styles.ratingText, { color: t.ink }]}>{book.rating}</Text>
                </View>
              ) : null}
              {book.finished_at && (
                <Text style={[styles.dateText, { color: t.muted }]}>
                  Finished {new Date(book.finished_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    // Sutil anillo en lugar de sombra pesada
    shadowColor: 'transparent',
  },
  coverContainer: {
    width: 70,
    height: 105,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#000',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 9,
    fontFamily: typography.fonts.sans,
    letterSpacing: 1,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    marginBottom: 2,
  },
  title: {
    fontFamily: typography.fonts.serif,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500',
  },
  author: {
    fontFamily: typography.fonts.sans,
    fontSize: 13,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 'auto',
  },
  progressSection: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    fontFamily: typography.fonts.sans,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontFamily: typography.fonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    fontFamily: typography.fonts.sans,
    fontStyle: 'italic',
  },
});
