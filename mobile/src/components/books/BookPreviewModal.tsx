import React, { useEffect, useState, useRef } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, Dimensions, Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { BookSearchResult, BookStatus } from '../../api/books';
import { Button, StarRating } from '../ui';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEAF_W = 240;
const LEAF_H = 340;

interface BookPreviewModalProps {
  visible: boolean;
  book: BookSearchResult | null;
  onClose: () => void;
  onAdd: (book: BookSearchResult, data: any) => void;
}

export const BookPreviewModal: React.FC<BookPreviewModalProps> = ({
  visible, book, onClose, onAdd
}) => {
  const { t, isDark } = useTheme();
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<BookStatus>('want_to_read');
  const [format, setFormat] = useState<'physical' | 'electronic'>('physical');
  const [startedAt, setStartedAt] = useState<Date>(new Date());
  const [finishedAt, setFinishedAt] = useState<Date>(new Date());
  const [rating, setRating] = useState<number | null>(null);
  
  // Animation values
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSuccess(false);
      setStatus('want_to_read');
      setFormat('physical');
      setRating(null);
      setStartedAt(new Date());
      setFinishedAt(new Date());
      successScale.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        delay: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
    } else {
      rotation.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(rotation, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleAddAction = () => {
    if (!book) return;
    setSuccess(true);
    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7
    }).start();
    
    setTimeout(() => {
      onAdd(book, {
        status,
        format,
        rating: rating || null,
        started_at: (status === 'reading' || status === 'read') ? startedAt.toISOString().split('T')[0] : null,
        finished_at: status === 'read' ? finishedAt.toISOString().split('T')[0] : null,
      });
    }, 1200);
  };

  if (!book) return null;

  // 3D Flip calculations
  // ... (keeping interpolation logic)
  const rotateY = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-165deg']
  });

  const backRotateY = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '15deg']
  });

  const contentOpacity = rotation.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0, 0, 1, 1]
  });

  const isReading = status === 'reading';
  const isRead = status === 'read';

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { backgroundColor: t.bg, opacity }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Success Overlay */}
          {success && (
            <Animated.View style={[styles.successOverlay, { backgroundColor: t.bg, opacity: successScale, transform: [{ scale: successScale }] }]}>
               <View style={[styles.successCircle, { borderColor: t.accent }]}>
                  <Text style={[styles.successCheck, { color: t.accent }]}>✓</Text>
               </View>
               <Text style={[styles.successText, { color: t.ink }]}>Añadido a la Biblioteca</Text>
            </Animated.View>
          )}

          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose} 
              style={[styles.closeBtn, { backgroundColor: t.panel, borderColor: t.ring }]}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={{ color: t.ink, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.eyebrow, { color: t.muted }]}>DESCUBRIMIENTO · PREVISUALIZACIÓN</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Book Stage */}
            <View style={styles.stage}>
              <View style={styles.bookWrapper}>
                {/* Spine Shadow */}
                <View style={styles.spineShadow} />

                {/* Internal Page */}
                <Animated.View style={[styles.page, { backgroundColor: t.panel, borderColor: t.ring, opacity: contentOpacity }]}>
                  <Text style={[styles.pageLabel, { color: t.muted }]}>PORTADA INTERNA</Text>
                  <Text style={[styles.pageTitle, { color: t.ink }]} numberOfLines={3}>{book.title}</Text>
                  <Text style={[styles.pageAuthor, { color: t.muted }]}>de {book.authors.join(', ')}</Text>
                  
                  <View style={[styles.divider, { backgroundColor: t.ring }]} />
                  
                  <View style={styles.specsGrid}>
                    <View style={styles.specItem}>
                      <Text style={styles.specKey}>AÑO</Text>
                      <Text style={[styles.specVal, { color: t.ink }]}>{book.published_date?.substring(0,4) || '?'}</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Text style={styles.specKey}>PÁGINAS</Text>
                      <Text style={[styles.specVal, { color: t.ink }]}>{book.page_count || '?'}</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1 }} />
                  <View style={[styles.divider, { backgroundColor: t.ring, opacity: 0.5 }]} />
                  <Text style={[styles.pageLabel, { color: t.muted, textAlign: 'right' }]}>iii</Text>
                </Animated.View>

                {/* Back side of the cover (Revealed when open) */}
                <Animated.View style={[
                  styles.backCover, 
                  { backgroundColor: t.panel, borderColor: t.ring }, 
                  { 
                    transform: [
                      { perspective: 1200 },
                      { translateX: -LEAF_W / 2 },
                      { rotateY: backRotateY },
                      { translateX: LEAF_W / 2 },
                    ] 
                  }
                ]} />

                {/* Cover (Front) */}
                <Animated.View style={[
                  styles.cover, 
                  { 
                    transform: [
                      { perspective: 1200 },
                      { translateX: -LEAF_W / 2 },
                      { rotateY: rotateY },
                      { translateX: LEAF_W / 2 },
                    ] 
                  }
                ]}>
                  {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={styles.coverImg} />
                  ) : (
                    <View style={[styles.placeholderCover, { backgroundColor: '#4a4539' }]}>
                       <Text style={styles.placeholderTitle}>{book.title}</Text>
                    </View>
                  )}
                  <View style={styles.coverSpine} />
                </Animated.View>
              </View>
            </View>

            {/* Synopsis and actions */}
            <View style={styles.infoSection}>
              {book.description && (
                <View style={styles.descriptionBox}>
                  <Text style={[styles.sectionLabel, { color: t.muted }]}>SINOPSIS</Text>
                  <Text style={[styles.description, { color: t.ink }]} numberOfLines={3}>
                    {book.description.replace(/<[^>]*>?/gm, '')}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: t.ring, marginBottom: 24 }]} />

              <View style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: t.muted }]}>AÑADIR A MI ESTANTERÍA</Text>
                
                <View style={[styles.statusSelector, { backgroundColor: t.panel, borderColor: t.ring }]}>
                  {(['want_to_read', 'reading', 'read'] as BookStatus[]).map((s) => (
                    <TouchableOpacity 
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[styles.statusOption, status === s && { backgroundColor: t.bg }]}
                    >
                      <Text style={[styles.statusOptionText, { color: status === s ? t.accent : t.muted }]}>
                        {s === 'want_to_read' ? 'Por leer' : s === 'reading' ? 'Leyendo' : 'Leído'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {(isReading || isRead) && (
                  <View style={styles.extraFields}>
                    <View style={styles.fieldRow}>
                      <Text style={[styles.fieldLabel, { color: t.muted }]}>FORMATO</Text>
                      <View style={styles.formatRow}>
                        <TouchableOpacity 
                          onPress={() => setFormat('physical')}
                          style={[styles.formatBtn, { borderColor: t.ring }, format === 'physical' && { backgroundColor: t.accent, borderColor: t.accent }]}
                        >
                          <Text style={[styles.formatBtnText, { color: format === 'physical' ? t.bg : t.ink }]}>Físico</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => setFormat('electronic')}
                          style={[styles.formatBtn, { borderColor: t.ring }, format === 'electronic' && { backgroundColor: t.accent, borderColor: t.accent }]}
                        >
                          <Text style={[styles.formatBtnText, { color: format === 'electronic' ? t.bg : t.ink }]}>Digital</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.fieldRow}>
                      <Text style={[styles.fieldLabel, { color: t.muted }]}>FECHA INICIO</Text>
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={startedAt}
                          mode="date"
                          display="compact"
                          themeVariant={isDark ? 'dark' : 'light'}
                          accentColor={t.accent}
                          onChange={(e, date) => date && setStartedAt(date)}
                        />
                      </View>
                    </View>

                    {isRead && (
                      <>
                        <View style={styles.fieldRow}>
                          <Text style={[styles.fieldLabel, { color: t.muted }]}>FECHA FIN</Text>
                          <View style={styles.pickerContainer}>
                            <DateTimePicker
                              value={finishedAt}
                              mode="date"
                              display="compact"
                              themeVariant={isDark ? 'dark' : 'light'}
                              accentColor={t.accent}
                              onChange={(e, date) => date && setFinishedAt(date)}
                            />
                          </View>
                        </View>
                        <View style={[styles.fieldRow, { marginTop: 4 }]}>
                          <Text style={[styles.fieldLabel, { color: t.muted }]}>VALORACIÓN</Text>
                          <StarRating rating={rating} onChange={setRating} size={24} />
                        </View>
                      </>
                    )}
                  </View>
                )}

                <Button 
                  title={status === 'read' ? "MARCAR COMO LEÍDO" : status === 'reading' ? "EMPEZAR LECTURA" : "AÑADIR A PENDIENTES"}
                  onPress={handleAddAction}
                  style={{ marginTop: 16 }}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, zIndex: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  eyebrow: { fontSize: 11, fontFamily: typography.fonts.sans, fontWeight: '500', letterSpacing: 1.5 },
  scrollContent: { paddingBottom: 60 },
  stage: { paddingVertical: 40, alignItems: 'center' },
  bookWrapper: { width: LEAF_W, height: LEAF_H, position: 'relative' },
  spineShadow: { position: 'absolute', left: -4, top: 8, bottom: 8, width: 8, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 4, zIndex: 0 },
  page: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '0 4px 4px 0', borderWidth: 1, padding: 24, zIndex: 1, elevation: 2 },
  pageLabel: { fontSize: 9, fontFamily: typography.fonts.sans, letterSpacing: 1.5, marginBottom: 12 },
  pageTitle: { fontFamily: typography.fonts.serif, fontSize: 22, lineHeight: 26, marginBottom: 6 },
  pageAuthor: { fontFamily: typography.fonts.serif, fontSize: 14, fontStyle: 'italic', marginBottom: 20 },
  divider: { height: 1, marginBottom: 16, opacity: 0.3 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  specItem: { minWidth: '40%' },
  specKey: { fontSize: 9, fontFamily: typography.fonts.sans, color: '#8a8478', letterSpacing: 1, marginBottom: 2 },
  specVal: { fontSize: 13, fontFamily: typography.fonts.serif },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 2, overflow: 'hidden', backfaceVisibility: 'hidden', zIndex: 4, elevation: 5 },
  coverImg: { width: '100%', height: '100%' },
  placeholderCover: { width: '100%', height: '100%', padding: 20, justifyContent: 'center' },
  placeholderTitle: { color: '#fff', fontFamily: typography.fonts.serif, fontSize: 20, textAlign: 'center' },
  coverSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, backgroundColor: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent)' },
  backCover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 4, borderWidth: 1, backfaceVisibility: 'hidden', zIndex: 3 },
  infoSection: { paddingHorizontal: 24, marginTop: 10 },
  descriptionBox: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontFamily: typography.fonts.sans, letterSpacing: 1, marginBottom: 16, fontWeight: '600' },
  description: { fontSize: 14, fontFamily: typography.fonts.sans, lineHeight: 22, opacity: 0.8 },
  formSection: { marginTop: 0 },
  statusSelector: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  statusOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  statusOptionText: { fontSize: 12, fontFamily: typography.fonts.sans, fontWeight: '600' },
  extraFields: { marginBottom: 16 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 0.5 },
  formatRow: { flexDirection: 'row', gap: 8 },
  formatBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  formatBtnText: { fontSize: 11, fontFamily: typography.fonts.sans, fontWeight: '500' },
  pickerContainer: { transform: [{ scale: 0.9 }], marginRight: -10 },
  btnRow: { flexDirection: 'row', gap: 12 },
  successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'center', alignItems: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successCheck: { fontSize: 40, fontWeight: 'bold' },
  successText: { fontSize: 18, fontFamily: typography.fonts.serif },
});
