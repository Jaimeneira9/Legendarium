import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { typography } from '@/theme';
import { MonthlyData, MonthlyItem } from '@/api/stats';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ACCENT = '#D4AF37';

interface Props {
  type: 'books' | 'movies';
  annualGoal: number;
  data: MonthlyData[]; // 12 months
  title: string; // e.g. "META LECTURA · 2026"
  theme: {
    ink: string;
    muted: string;
    panel: string;
    ring: string;
    accent: string;
    bg: string;
  };
}

export const MonthlyGoalChart: React.FC<Props> = ({ annualGoal, data, title, theme }) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // 1-based

  const currentMonth = new Date().getMonth() + 1; // 1-based
  const currentYear = new Date().getFullYear();

  // Build a complete 12-entry array aligned by month number
  const monthlyMap: Record<number, MonthlyData> = {};
  for (const d of data) {
    monthlyMap[d.month] = d;
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    return monthlyMap[monthNum] ?? { 
      month: monthNum, 
      count: 0, 
      physical_count: 0, 
      electronic_count: 0, 
      items: [] 
    };
  });

  const totalCount = months.reduce((sum, m) => sum + m.count, 0);

  // Max bar height reference
  const maxMonthCount = Math.max(...months.map(m => m.count), 1);
  const goalPerMonth = annualGoal > 0 ? annualGoal / 12 : 1;
  const barRef = Math.max(maxMonthCount, goalPerMonth, 1);

  const selectedData = selectedMonth !== null ? (monthlyMap[selectedMonth] ?? { month: selectedMonth, count: 0, items: [] }) : null;

  const PHYSICAL_COLOR = theme.accent;
  const ELECTRONIC_COLOR = '#527d9a'; // A muted editorial blue

  return (
    <View>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[typography.styles.eyebrow, { color: theme.muted }]}>{title}</Text>
        <Text style={[styles.totalText, { color: theme.ink }]}>
          {totalCount}/{annualGoal}
        </Text>
      </View>

      {/* Bar chart */}
      <View style={[styles.chartWrapper, { backgroundColor: theme.panel, borderColor: theme.ring }]}>
        <View style={styles.barsRow}>
          {months.map((monthData, i) => {
            const monthNum = i + 1;
            const isCurrent = monthNum === currentMonth;
            const isFuture = monthNum > currentMonth;
            
            const totalH = (monthData.count / barRef) * 100;
            const physH = monthData.count > 0 ? (monthData.physical_count / monthData.count) * 100 : 0;
            const elecH = monthData.count > 0 ? (monthData.electronic_count / monthData.count) * 100 : 0;

            const barOpacity = isFuture ? 0.3 : (isCurrent ? 1 : 0.8);

            return (
              <TouchableOpacity
                key={monthNum}
                activeOpacity={0.7}
                onPress={() => setSelectedMonth(monthNum)}
                style={styles.barColumn}
              >
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.barContainer,
                      {
                        height: totalH > 0 ? `${Math.max(totalH, 4)}%` : 3,
                        opacity: barOpacity,
                        borderColor: isCurrent ? theme.accent : 'transparent',
                        borderWidth: isCurrent && monthData.count === 0 ? 1 : 0,
                        borderStyle: 'dashed',
                      },
                    ]}
                  >
                    {monthData.count > 0 && (
                      <>
                        <View style={{ height: `${elecH}%`, backgroundColor: ELECTRONIC_COLOR }} />
                        <View style={{ height: `${physH}%`, backgroundColor: PHYSICAL_COLOR }} />
                      </>
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.monthLabel,
                    {
                      color: isCurrent ? theme.accent : theme.muted,
                      fontWeight: isCurrent ? '700' : '400',
                    },
                  ]}
                >
                  {MONTH_LABELS[i]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: PHYSICAL_COLOR }]} />
          <Text style={[styles.legendText, { color: theme.muted }]}>Físico</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ELECTRONIC_COLOR }]} />
          <Text style={[styles.legendText, { color: theme.muted }]}>Electrónico</Text>
        </View>
      </View>

      {/* Detail Modal */}
      <Modal visible={selectedMonth !== null} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSelectedMonth(null)}>
          <View style={[styles.modalContent, { backgroundColor: theme.panel, borderColor: theme.ring }]}>
            <Text style={[styles.modalTitle, { color: theme.ink }]}>
              {selectedMonth !== null ? MONTH_NAMES[selectedMonth - 1] : ''} {currentYear}
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.ring }]} />

            {selectedData && selectedData.items.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.muted }]}>Sin registros este mes</Text>
            ) : (
              <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
                {selectedData?.items.map((item: MonthlyItem, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    {item.cover_url ? (
                      <Image source={{ uri: item.cover_url }} style={styles.cover} resizeMode="cover" />
                    ) : (
                      <View style={[styles.coverPlaceholder, { backgroundColor: theme.bg }]}>
                        <Text style={{ fontSize: 18 }}>{selectedMonth !== null && (monthlyMap[selectedMonth]?.month ?? 0) > 0 ? '📕' : '🎬'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: theme.ink }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.rating !== null && (
                        <Text style={[styles.itemRating, { color: ACCENT }]}>
                          {'★'.repeat(Math.round(item.rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(item.rating)))}
                        </Text>
                      )}
                      <Text style={[styles.itemDate, { color: theme.muted }]}>
                        {item.date}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity onPress={() => setSelectedMonth(null)} style={styles.closeBtn}>
              <Text style={{ color: ACCENT, fontWeight: '600' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  totalText: {
    fontSize: 13,
    fontFamily: typography.fonts.serif,
  },
  chartWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    paddingBottom: 4,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barArea: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '100%',
    borderRadius: 2,
    minHeight: 3,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  monthLabel: {
    fontSize: 7,
    fontFamily: typography.fonts.sans,
    marginTop: 4,
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: typography.fonts.sans,
    fontWeight: '500',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemList: {
    maxHeight: 320,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  cover: {
    width: 40,
    height: 60,
    borderRadius: 4,
  },
  coverPlaceholder: {
    width: 40,
    height: 60,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemRating: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 11,
    fontFamily: typography.fonts.sans,
  },
  closeBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    padding: 8,
  },
});
