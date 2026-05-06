import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  RefreshControl, Modal, ScrollView, TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, EmptyState, Button } from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { financeApi, Transaction, FinanceStats, FinanceReport } from '@/api/finance';
import { PieChart } from 'react-native-gifted-charts';
import { EditTransactionModal } from '@/components/finance/EditTransactionModal';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function FinanceScreen() {
  const { t } = useTheme();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  
  const [reportVisible, setReportVisible] = useState(false);
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<{name: string, amount: number} | null>(null);
  const [selectedReportCategory, setSelectedReportCategory] = useState<{name: string, amount: number} | null>(null);
  
  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Add State
  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const [txData, statsData] = await Promise.all([
        financeApi.getTransactions(year, month),
        financeApi.getStats(year, month)
      ]);
      setTransactions(txData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentDate]);

  const changeMonth = (delta: number) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(nextDate);
    setLoading(true);
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await financeApi.getReport(currentDate.getFullYear(), currentDate.getMonth() + 1);
      setReport(res);
      setReportVisible(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportPDF = async () => {
    if (!report) return;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #141413; background-color: #f5f4ed; }
            h1 { font-family: 'Georgia', serif; font-weight: 500; color: #c96442; font-size: 32px; margin-bottom: 10px; }
            .period { color: #8a887d; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px; }
            .card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e3d1; margin-bottom: 24px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .summary-item { flex: 1; text-align: center; }
            .label { font-size: 10px; color: #8a887d; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
            .value { font-size: 24px; font-family: 'Georgia', serif; }
            .insight { padding: 16px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; }
            .warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
            .critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
            .success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
          </style>
        </head>
        <body>
          <h1>Crónica de Leyenda</h1>
          <div class="period">${report.period}</div>
          
          <div class="summary-row">
            <div class="summary-item">
              <div class="label">Ingresos</div>
              <div class="value" style="color: #4a7c44">${report.summary.income}€</div>
            </div>
            <div class="summary-item">
              <div class="label">Gastos</div>
              <div class="value">${report.summary.spent}€</div>
            </div>
            <div class="summary-item">
              <div class="label">Balance</div>
              <div class="value" style="color: ${report.summary.balance >= 0 ? '#4a7c44' : '#c96442'}">${report.summary.balance}€</div>
            </div>
          </div>

          <h3>Puntos Críticos</h3>
          ${report.insights.map(i => `
            <div class="insight ${i.type}">
              <strong>${i.title}:</strong> ${i.desc}
            </div>
          `).join('')}

          <div class="card">
            <div class="label">Mayor Categoría de Gasto</div>
            <div class="value">${report.top_category.name}</div>
            <div style="font-size: 12px; color: #8a887d; margin-top: 8px;">Representa el ${report.top_category.percentage}% de tus gastos.</div>
          </div>

          <div style="text-align: center; margin-top: 60px; font-size: 10px; color: #8a887d;">
            Generado por Legendarium Finance • Crónica Automática
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderHeader = () => {
    if (!stats) return null;

    const pieData = stats.by_category.map(cat => ({
      value: cat.amount,
      color: cat.color || t.accent,
      label: cat.name
    }));

    const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && 
                          currentDate.getFullYear() === new Date().getFullYear();

    return (
      <View style={styles.headerContent}>
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <ScreenHeader 
            eyebrow="TUS FINANZAS" 
            title="Tu Tesorería" 
            trailing={
              <TouchableOpacity 
                onPress={() => setAddModalVisible(true)}
                style={[styles.addBtnCircle, { backgroundColor: t.accent }]}
              >
                <Text style={{ color: 'white', fontSize: 24, marginTop: -2 }}>+</Text>
              </TouchableOpacity>
            }
          />
          
          {/* Selector de Mes */}
          <View style={[styles.monthSelector, { backgroundColor: t.panel, borderColor: t.ring }]}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNav}>
              <Text style={{ fontSize: 18, color: t.accent }}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setMonthPickerVisible(true)} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.monthLabel, { color: t.ink }]}>
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => changeMonth(1)} 
              style={styles.monthNav}
              disabled={isCurrentMonth}
            >
              <Text style={{ fontSize: 18, color: isCurrentMonth ? t.muted : t.accent }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal de Selector de Mes Directo */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={monthPickerVisible}
          onRequestClose={() => setMonthPickerVisible(false)}
        >
          <View style={styles.modalOverlayCenter}>
            <View style={[styles.pickerContent, { backgroundColor: t.panel, borderColor: t.ring }]}>
              <Text style={[styles.modalTitleSmall, { color: t.ink }]}>Elegir Mes ({currentDate.getFullYear()})</Text>
              <View style={styles.monthGrid}>
                {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                  const isSelected = currentDate.getMonth() === i;
                  return (
                    <TouchableOpacity 
                      key={i} 
                      style={[
                        styles.monthGridItem, 
                        { backgroundColor: isSelected ? t.accent : 'transparent', borderColor: t.ring }
                      ]}
                      onPress={() => {
                        const nextDate = new Date(currentDate.getFullYear(), i, 1);
                        setCurrentDate(nextDate);
                        setMonthPickerVisible(false);
                        setLoading(true);
                      }}
                    >
                      <Text style={{ 
                        color: isSelected ? 'white' : t.ink, 
                        fontWeight: isSelected ? '700' : '400',
                        fontSize: 12
                      }}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Button title="Cerrar" variant="outline" onPress={() => setMonthPickerVisible(false)} />
            </View>
          </View>
        </Modal>

        {/* Resumen de Balance y Barras */}
        {stats && (stats.total_spent > 0 || stats.total_income > 0) ? (
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <View style={styles.balanceSummary}>
              <Text style={[styles.balanceLabel, { color: t.muted }]}>BALANCE NETO</Text>
              <Text style={[
                styles.mainBalance, 
                { color: stats.balance >= 0 ? '#4a7c44' : t.accent }
              ]}>
                {stats.balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>

            <View style={[styles.mainBarsContainer, { backgroundColor: t.panel, borderColor: t.ring }]}>
              <Text style={[styles.mainSectionTitle, { color: t.ink }]}>Distribución de Tesorería</Text>
              {stats.by_category.map((cat, idx) => {
                const percentage = (cat.amount / stats.total_spent) * 100;
                return (
                  <View key={idx} style={styles.mainBarRow}>
                    <View style={styles.mainBarInfo}>
                      <Text style={[styles.mainBarName, { color: t.ink }]}>{cat.name}</Text>
                      <Text style={[styles.mainBarDetails, { color: t.muted }]}>
                        {cat.amount.toFixed(2)}€ • {percentage.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={[styles.mainBarBg, { backgroundColor: t.ring }]}>
                      <View 
                        style={[
                          styles.mainBarFill, 
                          { width: `${percentage}%`, backgroundColor: cat.color || t.accent }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Botón de Informe (cuando hay datos) */}
            {(!isCurrentMonth || new Date().getDate() === new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) && (
              <Button 
                title={generatingReport ? "Sellando..." : "Informe del Mes"} 
                onPress={handleGenerateReport}
                variant="outline"
                style={{ marginTop: 24 }}
              />
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <EmptyState 
              icon="📜" 
              title="Libro de Cuentas Vacío" 
              description={loading ? "Consultando archivos..." : "No hay actividad financiera registrada en este periodo."} 
            />
            
            {/* Mostrar el botón si es el último día del mes O si es un mes pasado */}
            {(!isCurrentMonth || new Date().getDate() === new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) && (
              <View style={{ marginTop: -20 }}>
                <Button 
                  title={generatingReport ? "Sellando..." : "Informe del Mes"} 
                  onPress={handleGenerateReport}
                  variant="outline"
                />
              </View>
            )}
          </View>
        )}

        {stats.total_spent > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.ink }]}>Distribución</Text>
            <View style={styles.categoryGrid}>
              {stats.by_category.map((cat, idx) => (
                <View key={idx} style={styles.categoryItem}>
                  <View style={styles.catInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.dot, { backgroundColor: cat.color || t.accent }]} />
                      <Text style={[styles.catName, { color: t.ink }]}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.catAmount, { color: t.ink }]}>
                      {cat.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {transactions.length > 0 && (
          <Text style={[styles.sectionTitle, { color: t.ink, paddingHorizontal: 24, marginTop: 12 }]}>
            Actividad Reciente
          </Text>
        )}
      </View>
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={[styles.txItem, { borderBottomColor: t.ring }]}
      onPress={() => {
        setSelectedTx(item);
        setEditModalVisible(true);
      }}
    >
      <View style={[styles.txIcon, { backgroundColor: item.category?.color || t.ring }]}>
        <Text style={{ fontSize: 16 }}>{item.category?.icon || '📦'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txMerchant, { color: t.ink }]} numberOfLines={1}>
          {item.merchant || 'Sin nombre'}
        </Text>
        <Text style={[styles.txDate, { color: t.muted }]}>
          {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <View style={styles.txAmountContainer}>
        <Text style={[
          styles.txAmount, 
          { color: item.is_income ? '#4a7c44' : t.ink }
        ]}>
          {item.is_income ? '+' : '-'}{Math.abs(item.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && transactions.length === 0 ? (
            <EmptyState 
              icon="⚖️"
              title="Libro Mayor Vacío"
              description="Marca tus emails de Unicaja como 'No leídos' para empezar la crónica de este mes."
            />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
      />
      
      {/* Modal del Informe Mensual Visual DARK */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportVisible}
        onRequestClose={() => setReportVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#141413' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: '#f5f4ed' }]}>Crónica Mensual</Text>
                <Text style={{ color: '#8a887d', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{report?.period}</Text>
              </View>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <View style={[styles.closeBtn, { backgroundColor: '#2a2a28' }]}>
                  <Text style={{ fontSize: 16, color: '#f5f4ed' }}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.reportScroll} showsVerticalScrollIndicator={false}>
              {report?.has_data ? (
                <>
                  {/* Resumen en Tarjetas Dark */}
                  <View style={styles.reportSummaryGrid}>
                    <View style={[styles.reportCard, { backgroundColor: '#1c1c1a', borderColor: '#2a2a28' }]}>
                      <Text style={[styles.reportCardLabel, { color: '#8a887d' }]}>INGRESOS</Text>
                      <Text style={[styles.reportCardValue, { color: '#829b7a' }]}>{report.summary.income}€</Text>
                    </View>
                    <View style={[styles.reportCard, { backgroundColor: '#1c1c1a', borderColor: '#2a2a28' }]}>
                      <Text style={[styles.reportCardLabel, { color: '#8a887d' }]}>GASTOS</Text>
                      <Text style={[styles.reportCardValue, { color: '#f5f4ed' }]}>{report.summary.spent}€</Text>
                    </View>
                  </View>

                  <View style={[styles.reportCardLarge, { backgroundColor: '#1c1c1a', borderColor: '#2a2a28' }]}>
                    <Text style={[styles.reportCardLabel, { color: '#8a887d' }]}>BALANCE NETO</Text>
                    <Text style={[styles.reportCardValueLarge, { color: report.summary.balance >= 0 ? '#829b7a' : '#c96442' }]}>
                      {report.summary.balance}€
                    </Text>
                  </View>

                  {/* Desglose de Tesorería en Barras (Mucho más accesible) */}
                  <Text style={[styles.reportSectionTitle, { color: '#f5f4ed' }]}>Desglose de Tesorería</Text>
                  <View style={[styles.reportBarsBox, { backgroundColor: '#1c1c1a', borderColor: '#2a2a28' }]}>
                    {report.by_category.map((cat, idx) => {
                      const percentage = (cat.amount / report.summary.spent) * 100;
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.reportBarRow}
                          onPress={() => setSelectedReportCategory({ name: cat.name, amount: cat.amount })}
                        >
                          <View style={styles.reportBarInfo}>
                            <Text style={[styles.reportBarName, { color: '#f5f4ed' }]}>{cat.name}</Text>
                            <Text style={[styles.reportBarAmount, { color: '#8a887d' }]}>{cat.amount.toFixed(2)}€</Text>
                          </View>
                          <View style={styles.reportBarBg}>
                            <View 
                              style={[
                                styles.reportBarFill, 
                                { width: `${percentage}%`, backgroundColor: cat.color || t.accent }
                              ]} 
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Puntos Críticos */}
                  <Text style={[styles.reportSectionTitle, { color: '#f5f4ed' }]}>Puntos Críticos</Text>
                  {report.insights.map((insight, idx) => (
                    <View key={idx} style={[styles.insightCard, { backgroundColor: '#1c1c1a', borderColor: insight.type === 'critical' ? '#c96442' : '#2a2a28' }]}>
                      <View style={styles.insightIcon}>
                        <Text>{insight.type === 'success' ? '✅' : insight.type === 'critical' ? '🔴' : '⚠️'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.insightTitle, { color: '#f5f4ed' }]}>{insight.title}</Text>
                        <Text style={[styles.insightDesc, { color: '#8a887d' }]}>{insight.desc}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Botón de Exportar */}
                  <Button 
                    title="Exportar Crónica (PDF)" 
                    onPress={exportPDF}
                    variant="primary"
                    style={{ marginTop: 24, backgroundColor: '#c96442' }}
                  />
                </>
              ) : (
                <EmptyState icon="📜" title="Sin Crónica" description={report?.message || ""} />
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading && !refreshing && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.bg, opacity: 0.6 }]}>
          <ActivityIndicator color={t.accent} size="large" />
        </View>
      )}

      <EditTransactionModal 
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        transaction={selectedTx}
        onUpdate={() => fetchData()}
      />

      <AddTransactionModal 
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => fetchData()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    paddingBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  addBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthNav: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  chartContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLegend: {
    flex: 1,
    marginLeft: 20,
    alignItems: 'center',
  },
  balanceSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 9,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  mainBalance: {
    fontSize: 24,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    marginBottom: 16,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryItem: {
    marginBottom: 4,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
    fontWeight: '500',
  },
  catAmount: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  txInfo: {
    flex: 1,
  },
  txMerchant: {
    fontSize: 15,
    fontFamily: typography.fonts.sans,
    fontWeight: '500',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  reportScroll: {
    flex: 1,
  },
  reportMarkdown: {
    fontSize: 15,
    fontFamily: typography.fonts.sans,
    lineHeight: 24,
    color: '#374151',
  },
  reportSummaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e3d1',
    alignItems: 'center',
  },
  reportCardLabel: {
    fontSize: 8,
    fontFamily: typography.fonts.sans,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#8a887d',
    marginBottom: 8,
  },
  reportCardValue: {
    fontSize: 20,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  reportCardLarge: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e3d1',
    alignItems: 'center',
    marginBottom: 24,
  },
  reportCardValueLarge: {
    fontSize: 32,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
  },
  reportSectionTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  reportChartBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1a',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a28',
    marginBottom: 24,
  },
  reportChartLegend: {
    flex: 1,
    marginLeft: 20,
  },
  reportBarsBox: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  reportBarRow: {
    marginBottom: 16,
  },
  reportBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  reportBarName: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
  },
  reportBarAmount: {
    fontSize: 11,
    fontFamily: typography.fonts.sans,
  },
  reportBarBg: {
    height: 6,
    backgroundColor: '#2a2a28',
    borderRadius: 3,
    overflow: 'hidden',
  },
  reportBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  insight_warning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  insight_critical: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  insight_success: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  insightIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  insightTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
    fontWeight: '700',
    marginBottom: 2,
  },
  insightDesc: {
    fontSize: 13,
    fontFamily: typography.fonts.sans,
    lineHeight: 18,
    opacity: 0.8,
  },
  highlightCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    alignItems: 'center',
  },
  highlightValue: {
    fontSize: 22,
    fontFamily: typography.fonts.serif,
    fontWeight: '500',
    marginVertical: 4,
  },
  highlightDesc: {
    fontSize: 12,
    color: '#8a887d',
    textAlign: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerContent: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  modalTitleSmall: {
    fontSize: 16,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  monthGridItem: {
    width: '23%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  mainBarsContainer: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
  },
  mainSectionTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  mainBarRow: {
    marginBottom: 18,
  },
  mainBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainBarName: {
    fontSize: 14,
    fontFamily: typography.fonts.sans,
    fontWeight: '600',
  },
  mainBarDetails: {
    fontSize: 12,
    fontFamily: typography.fonts.sans,
  },
  mainBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  mainBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
