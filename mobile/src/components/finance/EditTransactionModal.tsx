import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  TextInput, ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Button, Input } from '@/components/ui';
import { financeApi, Transaction, Category } from '@/api/finance';

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onUpdate: () => void;
}

export const EditTransactionModal = ({ visible, onClose, transaction, onUpdate }: EditTransactionModalProps) => {
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
    if (visible && transaction) {
      setAmount(transaction.amount.toString());
      setMerchant(transaction.merchant || '');
      setCategoryId(transaction.category_id);
      setIsIncome(transaction.is_income);
      setDate(new Date(transaction.date));
      fetchCategories();
    }
  }, [visible, transaction]);

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
    if (!transaction) return;
    setSaving(true);
    try {
      await financeApi.updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        merchant,
        category_id: categoryId,
        is_income: isIncome,
        date: date.toISOString()
      });
      onUpdate();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la transacción');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    Alert.alert(
      'Eliminar Transacción',
      '¿Estás seguro de que quieres eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await financeApi.deleteTransaction(transaction.id);
              onUpdate();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la transacción');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: t.bg, borderColor: t.ring }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.ink }]}>Editar Transacción</Text>
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
              label="Comercio / Concepto"
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Ej. Mercadona, Nómina..."
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

            <View style={{ height: 20 }} />
            
            <Button 
              title={saving ? "Guardando..." : "Guardar Cambios"} 
              onPress={handleSave} 
              disabled={saving}
            />

            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={{ color: t.accent, fontWeight: '600' }}>Eliminar Transacción</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, padding: 24 },
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
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', borderColor: '#e5e3d1' },
  deleteBtn: { marginTop: 24, paddingVertical: 12, alignItems: 'center' }
});
