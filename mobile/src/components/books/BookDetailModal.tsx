import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, Alert, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StarRating } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { booksApi, UserBook, BookStatus, UserBookUpdate } from '../../api/books';
import * as Haptics from 'expo-haptics';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface BookDetailModalProps {
  visible: boolean;
  book: UserBook | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const STATUS_OPTIONS: { label: string; value: BookStatus }[] = [
  { label: 'Leyendo', value: 'reading' },
  { label: 'Por leer', value: 'want_to_read' },
  { label: 'Leído', value: 'read' },
  { label: 'Abandonado', value: 'dropped' },
];

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ 
  visible, book, onClose, onUpdate, onDelete 
}) => {
  const { t, isDark } = useTheme();
  const [status, setStatus] = useState<BookStatus>('want_to_read');
  const [format, setFormat] = useState<'physical' | 'electronic'>('physical');
  const [currentPage, setCurrentPage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<'started' | 'finished' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && book) {
      setStatus(book.status);
      setFormat(book.format || 'physical');
      setCurrentPage(book.current_page.toString());
      setProgressPercentage(book.progress_percentage?.toString() || '');
      setRating(book.rating || null);
      setNotes(book.notes || '');
      setStartedAt(book.started_at ? new Date(book.started_at) : null);
      setFinishedAt(book.finished_at ? new Date(book.finished_at) : null);
    }
  }, [book, visible]);

  // Sincronizar páginas -> porcentaje
  const handlePageChange = (text: string) => {
    setCurrentPage(text);
    const pages = parseInt(text);
    if (book?.page_count && !isNaN(pages)) {
      const percent = Math.min(Math.round((pages / book.page_count) * 100 * 100) / 100, 100);
      setProgressPercentage(percent.toString());
    }
  };

  // Sincronizar porcentaje -> páginas
  const handlePercentChange = (text: string) => {
    setProgressPercentage(text);
    const percent = parseFloat(text);
    if (book?.page_count && !isNaN(percent)) {
      const pages = Math.round((percent / 100) * book.page_count);
      setCurrentPage(pages.toString());
    }
  };

  const handleStatusChange = (newStatus: BookStatus) => {
    setStatus(newStatus);
    const today = new Date();
    
    if (newStatus === 'reading' && !startedAt) {
      setStartedAt(today);
    } else if (newStatus === 'read') {
      setFinishedAt(today);
      setCurrentPage(book?.page_count?.toString() || '0');
      setProgressPercentage('100');
    }
  };

  const handleSave = async () => {
    if (!book) return;
    setLoading(true);
    try {
      const data: UserBookUpdate = {
        status,
        format,
        current_page: parseInt(currentPage) || 0,
        progress_percentage: parseFloat(progressPercentage) || 0,
        rating: rating || undefined,
        notes: notes || undefined,
        started_at: startedAt ? startedAt.toISOString().split('T')[0] : null,
        finished_at: finishedAt ? finishedAt.toISOString().split('T')[0] : null,
      };
      await booksApi.updateBook(book.id, data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'No se pudo actualizar el libro');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFinished = () => {
    Alert.alert('¡Enhorabuena!', '¿Has terminado el libro? Esto lo moverá a tu estantería de Leídos.', [
      { text: 'Aún no', style: 'cancel' },
      { text: '¡Sí!', onPress: () => handleStatusChange('read') }
    ]);
  };

  const handleDelete = () => {
    if (!book) return;
    Alert.alert(
      'Eliminar Libro',
      '¿Estás seguro de que quieres eliminar este libro de tu biblioteca?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await booksApi.deleteBook(book.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete();
            onClose();
          } catch (error) {
            console.error('Delete error:', error);
          }
        }},
      ]
    );
  };

  if (!book) return null;

  const isReading = status === 'reading';
  const displayPercent = progressPercentage || (book.page_count ? Math.round((parseInt(currentPage) || 0) / book.page_count * 100).toString() : '0');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: t.overlay }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.content, { backgroundColor: t.bg }]}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: t.accent }]}>
                  {isReading ? 'REGISTRO ACTUAL' : 'ARCHIVO DEL LIBRO'}
                </Text>
                <Text style={[styles.title, { color: t.ink }]} numberOfLines={1}>
                  {isReading ? 'Diario de Lectura' : 'Detalles del Volumen'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={[styles.closeCircle, { borderColor: t.ring }]}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={{ color: t.ink, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.mainInfo}>
                 <View style={[styles.bookShadow, { shadowColor: '#000' }]}>
                    {book.cover_url ? (
                      <Image source={{ uri: book.cover_url }} style={styles.detailCover} />
                    ) : (
                      <View style={[styles.detailCover, { backgroundColor: t.panel }]} />
                    )}
                 </View>
                 <View style={styles.titleBlock}>
                    <Text style={[styles.detailTitle, { color: t.ink }]}>{book.title}</Text>
                    <Text style={[styles.detailAuthor, { color: t.muted }]}>de {book.authors.join(', ')}</Text>
                 </View>
              </View>

              <View style={[styles.journalSection, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <Text style={[styles.sectionLabel, { color: t.muted }]}>GESTIÓN DEL VOLUMEN</Text>
                
                {/* Status Selector */}
                <View style={[styles.statusSelector, { backgroundColor: t.panel, borderColor: t.ring }]}>
                  {STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity 
                      key={opt.value}
                      onPress={() => handleStatusChange(opt.value)}
                      style={[styles.statusOption, status === opt.value && { backgroundColor: t.bg }]}
                    >
                      <Text style={[styles.statusOptionText, { color: status === opt.value ? t.accent : t.muted }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Format Selector */}
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

                {(isReading || status === 'read') && (
                  <View style={styles.dateInfoRow}>
                    <View style={styles.dateBox}>
                      <Text style={[styles.dateLabel, { color: t.muted }]}>EMPEZADO</Text>
                      <DateTimePicker
                        value={startedAt || new Date()}
                        mode="date"
                        display="compact"
                        accentColor={t.accent}
                        themeVariant={isDark ? 'dark' : 'light'}
                        onChange={(event, date) => date && setStartedAt(date)}
                        style={styles.nativePicker}
                      />
                    </View>
                    {status === 'read' && (
                      <View style={[styles.dateBox, { marginLeft: 12 }]}>
                        <Text style={[styles.dateLabel, { color: t.muted }]}>FINALIZADO</Text>
                        <DateTimePicker
                          value={finishedAt || new Date()}
                          mode="date"
                          display="compact"
                          accentColor={t.accent}
                          themeVariant={isDark ? 'dark' : 'light'}
                          onChange={(event, date) => date && setFinishedAt(date)}
                          style={styles.nativePicker}
                        />
                      </View>
                    )}
                  </View>
                )}

                <View style={[styles.divider, { backgroundColor: t.ring, marginVertical: 20 }]} />

                {isReading && (
                  <>
                    <Text style={[styles.sectionLabel, { color: t.muted }]}>PROGRESO ACTUAL</Text>
                    <View style={styles.progressUpdateRow}>
                      <View style={styles.inputWrapper}>
                        <Text style={[styles.inputPrefix, { color: t.muted }]}>Página</Text>
                        <TextInput
                          style={[styles.pageInput, { color: t.ink }]}
                          value={currentPage}
                          onChangeText={handlePageChange}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                        <Text style={[styles.inputSuffix, { color: t.muted }]}>de {book.page_count || '?'}</Text>
                      </View>

                      <View style={[styles.percentageInputWrapper, { borderColor: t.ringStrong }]}>
                        <TextInput
                          style={[styles.percentInput, { color: t.accent }]}
                          value={Math.round(parseFloat(progressPercentage) || 0).toString()}
                          onChangeText={handlePercentChange}
                          keyboardType="numeric"
                          placeholder="0"
                          maxLength={3}
                        />
                        <Text style={[styles.percentSymbol, { color: t.accent }]}>%</Text>
                      </View>
                    </View>
                    
                    <View style={[styles.progressTrack, { backgroundColor: t.ring }]}>
                      <View style={[styles.progressFill, { backgroundColor: t.accent, width: `${Math.min(parseFloat(displayPercent) || 0, 100)}%` }]} />
                    </View>
                  </>
                )}
              </View>


              <View style={styles.marginaliaSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: t.muted }]}>NOTAS AL MARGEN</Text>
                  <Text style={[styles.noteDate, { color: t.muted }]}>Última edición: Hoy</Text>
                </View>
                <View style={[styles.notesContainer, { backgroundColor: t.panel, borderColor: t.ring }]}>
                   <TextInput
                      style={[styles.notesInput, { color: t.ink }]}
                      multiline
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Pensamientos, citas, reflexiones..."
                      placeholderTextColor="#a09a8e"
                   />
                </View>
              </View>

              {status === 'read' && (
                <View style={styles.ratingSection}>
                   <Text style={[styles.sectionLabel, { color: t.muted }]}>VALORACIÓN</Text>
                   <StarRating rating={rating} onChange={setRating} size={32} />
                </View>
              )}

              <View style={styles.footerActions}>
                <Button 
                  title="GUARDAR DIARIO" 
                  onPress={handleSave} 
                  loading={loading}
                />
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Eliminar de la biblioteca</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  safeArea: { flex: 1 },
  content: { flex: 1, marginTop: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  eyebrow: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: typography.fonts.serif, fontWeight: '500' },
  closeCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  mainInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  bookShadow: {
    width: 100,
    height: 150,
    borderRadius: 8,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  detailCover: { width: '100%', height: '100%', borderRadius: 8 },
  titleBlock: { flex: 1, marginLeft: 24 },
  detailTitle: { fontSize: 20, fontFamily: typography.fonts.serif, fontWeight: '500', lineHeight: 24, marginBottom: 8 },
  detailAuthor: { fontSize: 15, fontFamily: typography.fonts.sans },
  journalSection: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 32 },
  sectionLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1.2, marginBottom: 16 },
  statusSelector: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  statusOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  statusOptionText: { fontSize: 12, fontFamily: typography.fonts.sans, fontWeight: '600' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 0.5 },
  formatRow: { flexDirection: 'row', gap: 8 },
  formatBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  formatBtnText: { fontSize: 11, fontFamily: typography.fonts.sans, fontWeight: '500' },
  progressUpdateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1.5 },
  percentageInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1,
    flex: 0.8,
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  percentInput: { 
    fontSize: 20, 
    fontFamily: typography.fonts.serif, 
    fontWeight: '600', 
    textAlign: 'right',
    minWidth: 30,
    padding: 0,
  },
  percentSymbol: { fontSize: 16, fontFamily: typography.fonts.serif, fontWeight: '600', marginLeft: 2 },
  inputPrefix: { fontSize: 14, fontFamily: typography.fonts.sans, marginRight: 8 },
  pageInput: { fontSize: 20, fontFamily: typography.fonts.serif, fontWeight: '600', minWidth: 40, padding: 0 },
  inputSuffix: { fontSize: 14, fontFamily: typography.fonts.sans, marginLeft: 8 },
  percentTag: { fontSize: 18, fontFamily: typography.fonts.serif, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%' },
  finishBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  finishBtnText: { fontSize: 12, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1 },
  dateInfoRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 9, fontFamily: typography.fonts.sans, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  nativePicker: { 
    alignSelf: 'flex-start',
    marginLeft: -8, // Pequeño ajuste para que el texto nativo se alinee con la etiqueta
  },
  archiveDates: { flexDirection: 'row', justifyContent: 'space-between' },
  archiveActions: { marginBottom: 32 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusLabel: { fontSize: 13, fontFamily: typography.fonts.sans, fontWeight: '500' },
  marginaliaSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  noteDate: { fontSize: 11, fontStyle: 'italic' },
  notesContainer: { padding: 16, borderRadius: 16, borderWidth: 1, minHeight: 150 },
  notesInput: { fontSize: 15, fontFamily: typography.fonts.sans, lineHeight: 22, textAlignVertical: 'top' },
  ratingSection: { marginBottom: 32 },
  starsRow: { flexDirection: 'row', gap: 12 },
  star: { fontSize: 32 },
  footerActions: { marginTop: 8 },
  deleteBtn: { marginTop: 20, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: '#c94242', fontSize: 14, fontFamily: typography.fonts.sans, fontWeight: '500' },
});
