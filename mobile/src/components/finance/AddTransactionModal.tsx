import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Button, Input } from '@/components/ui';
import { financeApi, Category } from '@/api/finance';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal = ({ visible, onClose, onSuccess }: AddTransactionModalProps) => {
  const { t } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isIncome, setIsIncome] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount('');
      setMerchant('');
      setCategoryId(null);
      setIsIncome(false);
      setDate(new Date());
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const cats = await financeApi.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !merchant) {
      Alert.alert('Error', 'Por favor rellena el importe y el concepto');
      return;
    }
    
    setSaving(true);
    try {
      await financeApi.addTransaction({
        amount: parseFloat(amount),
        merchant,
        category_id: categoryId,
        is_income: isIncome,
        date: date.toISOString()
      });
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la transacción');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: t.bg, borderColor: t.ring }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.ink }]}>Nuevo Gasto / Ingreso</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: t.accent, fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Input 
              label="Importe (€)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <Input 
              label="Concepto"
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Ej. Café, Supermercado..."
            />

            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: t.muted }]}>Fecha</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={[styles.dateBtn, { backgroundColor: t.panel, borderColor: t.ring }]}
              >
                <Text style={{ color: t.ink }}>
                  {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </View>

            <Text style={[styles.label, { color: t.muted }]}>Categoría</Text>
            {loading ? (
              <ActivityIndicator color={t.accent} />
            ) : (
              <View style={styles.categoryGrid}>
                {categories.map(cat => (
                  <TouchableOpacity 
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.categoryChip, 
                      { backgroundColor: categoryId === cat.id ? cat.color || t.accent : t.panel, borderColor: t.ring },
                      categoryId === cat.id && { borderWidth: 0 }
                    ]}
                  >
                    <Text style={{ fontSize: 16, marginRight: 4 }}>{cat.icon}</Text>
                    <Text style={[styles.categoryText, { color: categoryId === cat.id ? 'white' : t.ink }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.typeContainer}>
              <TouchableOpacity 
                onPress={() => setIsIncome(false)}
                style={[styles.typeBtn, !isIncome && { backgroundColor: t.accent, borderColor: t.accent }]}
              >
                <Text style={{ color: !isIncome ? 'white' : t.ink }}>Gasto</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setIsIncome(true)}
                style={[styles.typeBtn, isIncome && { backgroundColor: '#4a7c44', borderColor: '#4a7c44' }]}
              >
                <Text style={{ color: isIncome ? 'white' : t.ink }}>Ingreso</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
            
            <Button 
              title={saving ? "Creando..." : "Registrar Transacción"} 
              onPress={handleSave} 
              disabled={saving}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontFamily: typography.fonts.serif, fontWeight: '500' },
  form: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: '500' },
  dateBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  typeContainer: { flexDirection: 'row', gap: 12, marginTop: 12 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', borderColor: '#e5e3d1' }
});
