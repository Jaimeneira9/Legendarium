import React, { useRef } from 'react';
import { 
  Modal, View, Text, StyleSheet, Image, TouchableOpacity, 
  Dimensions, Share, Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { MonthlyHighlight } from '../../api/stats';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';

const { width, height } = Dimensions.get('window');

interface MonthlyStoryModalProps {
  visible: boolean;
  onClose: () => void;
  highlight: MonthlyHighlight | null;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MonthlyStoryModal: React.FC<MonthlyStoryModalProps> = ({ 
  visible, onClose, highlight 
}) => {
  const { t } = useTheme();
  const viewRef = useRef<View>(null);

  if (!highlight) return null;

  const handleCaptureAndShare = async () => {
    try {
      if (!viewRef.current) {
        console.warn('View reference not found');
        return;
      }
      
      // Capturamos con dimensiones específicas de Story (1080x1920 relativas)
      // para asegurar que siempre sea 9:16 perfecto
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      
      await shareAsync(uri, {
        dialogTitle: 'Compartir Crónica en Instagram',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('Error capturando o compartiendo la vista:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeHeader}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* The Story Card (9:16 aspect) */}
          <View style={styles.cardWrapper}>
            <View 
              ref={viewRef} 
              collapsable={false}
              style={[styles.cardContainer, { backgroundColor: t.bg }]}
            >
              <LinearGradient
                colors={[t.panel, t.bg]}
                style={styles.cardGradient}
              >
                {/* Decorative elements */}
                <View style={[styles.cornerDecoration, { borderColor: t.accent + '20' }]} />
                
                <View style={styles.cardHeader}>
                  <Text style={[styles.brand, { color: t.muted }]}>LEGENDARIUM</Text>
                  <View style={[styles.badge, { backgroundColor: t.accent }]}>
                    <Text style={styles.badgeText}>{highlight.year}</Text>
                  </View>
                </View>

                <View style={styles.mainContent}>
                  <View style={styles.titleSection}>
                    <Text style={[styles.eyebrow, { color: t.accent }]}>CRÓNICA MENSUAL</Text>
                    <Text style={[styles.title, { color: t.ink }]}>{MONTHS[highlight.month - 1].toUpperCase()}</Text>
                    <View style={[styles.divider, { backgroundColor: t.accent }]} />
                  </View>

                  {/* Grid of Achievements */}
                  <View style={styles.grid}>
                    <StoryStat label="PÁGINAS" value={highlight.pages_read} icon="📖" t={t} />
                    <StoryStat label="PELÍCULAS" value={highlight.movies_watched} icon="🎬" t={t} />
                    <StoryStat label="EPISODIOS" value={highlight.episodes_watched} icon="📺" t={t} />
                    <StoryStat label="TIEMPO" value={highlight.reading_time_estimate.split(' ')[0]} subValue={highlight.reading_time_estimate.split(' ')[1] || ''} icon="⏳" t={t} />
                  </View>

                  {/* Highlight Images */}
                  <View style={styles.highlights}>
                    <View style={styles.highlightSlot}>
                      <Text style={[styles.highlightLabel, { color: t.muted }]}>LIBRO TOP</Text>
                      <View style={[styles.imageFrame, { borderColor: t.ringStrong }]}>
                        {highlight.best_book?.cover_url ? (
                          <Image source={{ uri: highlight.best_book.cover_url }} style={styles.highlightImg} />
                        ) : (
                          <View style={[styles.highlightImg, { backgroundColor: t.panel, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 24 }}>📕</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.highlightTitle, { color: t.ink }]} numberOfLines={1}>{highlight.best_book?.title || '—'}</Text>
                    </View>

                    <View style={styles.highlightSlot}>
                      <Text style={[styles.highlightLabel, { color: t.muted }]}>FILME TOP</Text>
                      <View style={[styles.imageFrame, { borderColor: t.ringStrong }]}>
                        {highlight.best_movie?.poster_url ? (
                          <Image source={{ uri: highlight.best_movie.poster_url }} style={styles.highlightImg} />
                        ) : (
                          <View style={[styles.highlightImg, { backgroundColor: t.panel, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 24 }}>🎬</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.highlightTitle, { color: t.ink }]} numberOfLines={1}>{highlight.best_movie?.title || '—'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.footerTag, { color: t.muted }]}>Mi camino en Legendarium</Text>
                  <Text style={[styles.url, { color: t.accent }]}>legendarium.app</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={handleCaptureAndShare}
              style={[styles.shareBtn, { backgroundColor: t.accent }]}
            >
              <Text style={styles.shareBtnText}>Generar Imagen y Compartir</Text>
            </TouchableOpacity>
            
            <Text style={[styles.hint, { color: '#fff' }]}>Ideal para Historias de Instagram ✨</Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const StoryStat = ({ label, value, subValue, icon, t }: { label: string, value: number | string, subValue?: string, icon: string, t: any }) => (
  <View style={styles.statBox}>
    <Text style={styles.statIcon}>{icon}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={[styles.statValue, { color: t.ink }]}>{value}</Text>
      {subValue && <Text style={[styles.statSubValue, { color: t.muted }]}> {subValue}</Text>}
    </View>
    <Text style={[styles.statLabel, { color: t.muted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  closeHeader: {
    alignSelf: 'flex-end',
    padding: 20,
  },
  closeIcon: {
    color: '#fff',
    fontSize: 24,
    opacity: 0.8,
  },
  cardWrapper: {
    width: width * 0.9,
    aspectRatio: 9 / 16,
    borderRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cornerDecoration: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 1,
    borderRadius: 16,
    pointerEvents: 'none',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
    marginBottom: 20,
  },
  brand: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 38,
    fontFamily: typography.fonts.serif,
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    width: 40,
    height: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  statBox: {
    width: '45%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
  },
  statSubValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  highlights: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  highlightSlot: {
    flex: 1,
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 6,
    elevation: 4,
  },
  highlightImg: {
    width: '100%',
    height: '100%',
  },
  highlightTitle: {
    fontSize: 10,
    fontFamily: typography.fonts.serif,
    textAlign: 'center',
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerTag: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  url: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
  shareBtn: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
  }
});
