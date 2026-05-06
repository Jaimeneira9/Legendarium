import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { MonthlyHighlight } from '../../api/stats';
import { LinearGradient } from 'expo-linear-gradient';

interface MonthlyHighlightCardProps {
  highlight: MonthlyHighlight | null;
  onPress?: () => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MonthlyHighlightCard: React.FC<MonthlyHighlightCardProps> = ({ highlight, onPress }) => {
  const { t } = useTheme();

  if (!highlight) return null;

  const handleShare = async () => {
    try {
      const message = `📜 Crónica de Leyenda - ${MONTHS[highlight.month - 1]}\n\n` +
        `📖 Leí ${highlight.pages_read} páginas (${highlight.books_finished} libros)\n` +
        `🎬 Vi ${highlight.movies_watched} películas\n` +
        `📺 Vi ${highlight.episodes_watched} episodios\n` +
        `⏳ Tiempo de inmersión: ${highlight.reading_time_estimate}\n\n` +
        `¡Sigue tu camino en Legendarium!`;
      
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing highlight:', error);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.outerContainer, { shadowColor: t.ink }]}
    >
      <View style={[styles.container, { backgroundColor: t.panel, borderColor: t.ringStrong }]}>
        {/* Header with Share */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: t.accent }]}>CRÓNICA DE LEYENDA</Text>
            <Text style={[styles.month, { color: t.ink }]}>{MONTHS[highlight.month - 1]} {highlight.year}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { backgroundColor: t.bg, borderColor: t.ring }]}>
            <Text style={{ fontSize: 16 }}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Items Grid */}
        <View style={styles.featuredRow}>
          {highlight.best_book && (
            <View style={styles.featuredItem}>
              <View style={[styles.imageWrapper, { shadowColor: '#000' }]}>
                {highlight.best_book.cover_url ? (
                  <Image source={{ uri: highlight.best_book.cover_url }} style={styles.poster} resizeMode="cover" />
                ) : (
                  <View style={[styles.poster, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>📖</Text>
                  </View>
                )}
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.6)']} 
                  style={styles.gradientOverlay}
                />
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>LIBRO DEL MES</Text>
                </View>
              </View>
              <Text style={[styles.itemTitle, { color: t.ink }]} numberOfLines={1}>{highlight.best_book.title}</Text>
              <Text style={[styles.itemSub, { color: t.muted }]} numberOfLines={1}>
                {highlight.best_book.authors.length > 0 ? highlight.best_book.authors[0] : 'Autor desconocido'}
              </Text>
            </View>
          )}

          {highlight.best_movie && (
            <View style={styles.featuredItem}>
              <View style={[styles.imageWrapper, { shadowColor: '#000' }]}>
                {highlight.best_movie.poster_url ? (
                  <Image source={{ uri: highlight.best_movie.poster_url }} style={styles.poster} resizeMode="cover" />
                ) : (
                  <View style={[styles.poster, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>🎬</Text>
                  </View>
                )}
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.6)']} 
                  style={styles.gradientOverlay}
                />
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>CINE DEL MES</Text>
                </View>
              </View>
              <Text style={[styles.itemTitle, { color: t.ink }]} numberOfLines={1}>{highlight.best_movie.title}</Text>
              <Text style={[styles.itemSub, { color: t.muted }]}>Rating: ★ {highlight.best_movie.rating || '—'}</Text>
            </View>
          )}
        </View>

        {/* Stats Summary */}
        <View style={[styles.summaryBox, { backgroundColor: t.bg, borderColor: t.ring }]}>
          <View style={styles.summaryGrid}>
            <StatSmall label="PÁGINAS" value={highlight.pages_read} t={t} />
            <StatSmall label="LIBROS" value={highlight.books_finished} t={t} />
            <StatSmall label="FILMES" value={highlight.movies_watched} t={t} />
            <StatSmall label="EPISODIOS" value={highlight.episodes_watched} t={t} />
          </View>
          
          <View style={[styles.divider, { backgroundColor: t.ring }]} />
          
          <View style={styles.footerInfo}>
            <View style={styles.footerRow}>
              <Text style={[styles.footerLabel, { color: t.muted }]}>Inmersión total</Text>
              <Text style={[styles.footerValue, { color: t.ink }]}>{highlight.reading_time_estimate}</Text>
            </View>
            {highlight.top_habit && (
              <View style={styles.footerRow}>
                <Text style={[styles.footerLabel, { color: t.muted }]}>Constancia</Text>
                <Text style={[styles.footerValue, { color: t.accent }]}>{highlight.top_habit.name}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StatSmall = ({ label, value, t }: { label: string, value: number, t: any }) => (
  <View style={styles.smallStat}>
    <Text style={[styles.smallStatValue, { color: t.ink }]}>{value}</Text>
    <Text style={[styles.smallStatLabel, { color: t.muted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  container: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  eyebrow: {
    fontFamily: typography.fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  month: {
    fontFamily: typography.fonts.serif,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 30,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  featuredItem: {
    flex: 1,
  },
  imageWrapper: {
    aspectRatio: 2/3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  featuredBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 11,
    fontFamily: typography.fonts.sans,
    opacity: 0.7,
  },
  summaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  smallStat: {
    alignItems: 'center',
    flex: 1,
  },
  smallStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: typography.fonts.serif,
  },
  smallStatLabel: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginBottom: 12,
    opacity: 0.5,
  },
  footerInfo: {
    gap: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fonts.sans,
  }
});
