import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { statsApi, MonthlyReport } from '@/api/stats';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface MonthlyReportModalProps {
  visible: boolean;
  onClose: () => void;
  year: number;
  month: number;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  visible, onClose, year, month
}) => {
  const { t } = useTheme();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyReport | null>(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    if (visible) {
      fetchReport();
    }
  }, [visible, year, month]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await statsApi.getMonthlyReport(year, month);
      setReport(data);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: t.muted }]}>✕ Cerrar</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.ink }]}>Crónica de Leyendas</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={t.accent} size="large" />
            <Text style={[styles.loadingText, { color: t.muted }]}>Analizando tus leyendas...</Text>
          </View>
        ) : report ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={styles.hero}>
              <Text style={[styles.heroMonth, { color: t.accent }]}>{monthNames[month - 1].toUpperCase()}</Text>
              <Text style={[styles.heroYear, { color: t.muted }]}>{year}</Text>
              <View style={[styles.heroDivider, { backgroundColor: t.accent }]} />
              <Text style={[styles.heroSub, { color: t.ink }]}>Tu balance de vida y ocio</Text>
            </View>

            {/* Time Summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.muted }]}>TIEMPO DISFRUTADO</Text>
              <View style={[styles.card, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <Text style={[styles.totalTime, { color: t.ink }]}>{formatTime(report.total_enjoyment_minutes)}</Text>
                <Text style={[styles.totalTimeSub, { color: t.muted }]}>Invertidos en tus pasiones</Text>
                
                <View style={styles.timeBreakdown}>
                  <TimeBar label="Libros" value={report.reading_time_minutes} total={report.total_enjoyment_minutes} color="#c96442" format={formatTime} theme={t} />
                  <TimeBar label="Series" value={report.series_time_minutes} total={report.total_enjoyment_minutes} color="#4a4e69" format={formatTime} theme={t} />
                  <TimeBar label="Cine" value={report.movies_time_minutes} total={report.total_enjoyment_minutes} color="#9a8c98" format={formatTime} theme={t} />
                </View>
              </View>
            </View>

            {/* Ocio Stats */}
            <View style={styles.grid}>
              <MiniCard label="LIBROS" subLabel="Terminados" value={report.books_finished} theme={t} />
              <MiniCard label="PÁGINAS" subLabel="Leídas" value={report.pages_read} theme={t} />
              <MiniCard label="CINE" subLabel="Películas" value={report.movies_watched} theme={t} />
              <MiniCard label="SERIES" subLabel="Episodios" value={report.episodes_watched} theme={t} />
            </View>

            {/* Finance Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.muted }]}>BALANCE ECONÓMICO</Text>
              <View style={[styles.card, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <View style={styles.financeHeader}>
                  <View>
                    <Text style={[styles.financeLabel, { color: t.muted }]}>BALANCE</Text>
                    <Text style={[styles.financeValue, { color: report.balance >= 0 ? '#4caf50' : t.accent }]}>
                      {report.balance.toFixed(2)}€
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.financeLabel, { color: t.muted }]}>GASTOS</Text>
                    <Text style={[styles.financeValue, { color: t.ink }]}>{report.expenses.toFixed(2)}€</Text>
                  </View>
                </View>

                <View style={styles.categoryList}>
                  {report.finance_breakdown.map((item, i) => (
                    <View key={i} style={styles.categoryItem}>
                      <View style={styles.categoryRow}>
                        <Text style={[styles.categoryName, { color: t.ink }]}>{item.category}</Text>
                        <Text style={[styles.categoryAmt, { color: t.muted }]}>{item.amount.toFixed(2)}€</Text>
                      </View>
                      <View style={[styles.progressBg, { backgroundColor: t.ring }]}>
                        <View style={[styles.progressFill, { backgroundColor: t.accent, width: `${item.percentage}%` }]} />
                      </View>
                      {item.alert && (
                        <View style={[styles.alertBox, { backgroundColor: t.accent + '15' }]}>
                          <Text style={[styles.alertText, { color: t.accent }]}>💡 {item.alert}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Habits Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.muted }]}>CONSTANCIA DE HÁBITOS</Text>
              <View style={styles.habitsGrid}>
                {report.habit_achievements.map((item, i) => (
                  <View key={i} style={[styles.habitLevelCard, { backgroundColor: t.panel, borderColor: t.ring }]}>
                    <Text style={[styles.habitLevel, { color: t.accent }]}>{item.days}</Text>
                    <Text style={[styles.habitLevelLabel, { color: t.muted }]}>Días</Text>
                    <Text style={[styles.habitLevelName, { color: t.ink }]}>{item.level}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        ) : (
          <View style={styles.centered}>
            <Text style={{ color: t.muted }}>No se han encontrado datos para este mes.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const TimeBar = ({ label, value, total, color, format, theme }: any) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  if (value === 0) return null;
  return (
    <View style={styles.timeBarRow}>
      <View style={styles.timeBarInfo}>
        <Text style={[styles.timeBarLabel, { color: theme.ink }]}>{label}</Text>
        <Text style={[styles.timeBarValue, { color: theme.muted }]}>{format(value)}</Text>
      </View>
      <View style={[styles.progressBg, { backgroundColor: theme.ring, height: 6 }]}>
        <View style={[styles.progressFill, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
    </View>
  );
};

const MiniCard = ({ label, subLabel, value, theme }: any) => (
  <View style={[styles.miniCard, { backgroundColor: theme.panel, borderColor: theme.ring }]}>
    <Text style={[styles.miniValue, { color: theme.ink }]}>{value}</Text>
    <Text style={[styles.miniLabel, { color: theme.accent }]}>{label}</Text>
    <Text style={[styles.miniSub, { color: theme.muted }]}>{subLabel}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8, // Margen extra para el notch
  },
  closeBtn: { 
    padding: 12, // Más área táctil
    borderRadius: 12,
  },
  closeText: { fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 14, fontFamily: typography.fonts.serif, letterSpacing: 2, textTransform: 'uppercase' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontStyle: 'italic' },
  scrollContent: { padding: 24 },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroMonth: {
    fontSize: 48,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  heroYear: {
    fontSize: 20,
    letterSpacing: 8,
    marginTop: -8,
  },
  heroDivider: {
    width: 40,
    height: 2,
    marginVertical: 20,
  },
  heroSub: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  totalTime: {
    fontSize: 32,
    fontFamily: typography.fonts.serif,
    textAlign: 'center',
  },
  totalTimeSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  timeBreakdown: {
    gap: 16,
  },
  timeBarRow: {
    gap: 8,
  },
  timeBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBarLabel: { fontSize: 13, fontWeight: '500' },
  timeBarValue: { fontSize: 12 },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  miniCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  miniValue: { fontSize: 24, fontFamily: typography.fonts.serif, marginBottom: 2 },
  miniLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  miniSub: { fontSize: 10 },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  financeLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  financeValue: { fontSize: 20, fontFamily: typography.fonts.serif },
  categoryList: { gap: 16 },
  categoryItem: { gap: 8 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryName: { fontSize: 13 },
  categoryAmt: { fontSize: 12 },
  alertBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  alertText: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  habitLevelCard: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  habitLevel: { fontSize: 18, fontWeight: 'bold' },
  habitLevelLabel: { fontSize: 10, marginBottom: 6 },
  habitLevelName: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' },
});
