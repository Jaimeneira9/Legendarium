import React from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, ActivityIndicator, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/api/stats';

const { width } = Dimensions.get('window');

interface SeriesBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SeriesBreakdownModal: React.FC<SeriesBreakdownModalProps> = ({
  visible, onClose
}) => {
  const { t } = useTheme();
  
  const { data: breakdown, isLoading } = useQuery({
    queryKey: ['seriesBreakdown'],
    queryFn: statsApi.getSeriesBreakdown,
    enabled: visible
  });

  const formatTime = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    
    let result = "";
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (mins > 0 && days === 0) result += `${mins}min`;
    return result.trim() || "0 min";
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: t.ink }]}>Desglose de Tiempo</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: t.muted }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={t.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.subtitle, { color: t.muted }]}>Tus series más vistas</Text>
            
            <View style={styles.list}>
              {breakdown?.map((item, i) => (
                <View key={i} style={[styles.item, { borderColor: t.ring }]}>
                  <Image 
                    source={{ uri: item.poster_url || 'https://via.placeholder.com/150' }} 
                    style={styles.poster}
                    resizeMode="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: t.ink }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.itemTime, { color: t.accent }]}>{formatTime(item.minutes_spent)}</Text>
                    <View style={[styles.progressBarBg, { backgroundColor: t.ring }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            backgroundColor: t.accent, 
                            width: `${Math.min(100, (item.minutes_spent / (breakdown[0]?.minutes_spent || 1)) * 100)}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 16, fontFamily: typography.fonts.serif, fontWeight: '600' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 14, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24 },
  subtitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    letterSpacing: 1, 
    textTransform: 'uppercase',
    marginBottom: 24 
  },
  list: { gap: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.serif,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
