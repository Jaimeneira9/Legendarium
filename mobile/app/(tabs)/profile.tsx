import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, ActivityIndicator, RefreshControl, Alert, Modal, Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme';
import { statsApi, ActivityEvent, ReadingProgressPoint, HabitCalendarDay } from '@/api/stats';
import { MonthlyGoalChart } from '@/components/profile/MonthlyGoalChart';
import { authApi } from '@/api/auth';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { format, subDays, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { MonthlyReportModal } from '@/components/profile/MonthlyReportModal';
import { useAuth } from '@/context/AuthContext';
import { ThemeMode } from '@/theme/colors';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SeriesBreakdownModal } from '@/components/profile/SeriesBreakdownModal';
import { LegendTitleBadge } from '@/components/gamification/LegendTitleBadge';
import { MonthlyHighlightCard } from '@/components/gamification/MonthlyHighlightCard';
import { MonthlyStoryModal } from '@/components/gamification/MonthlyStoryModal';
import { useHaptics } from '@/hooks/useHaptics';
import { TouchableScale } from '@/components/ui/TouchableScale';

const STATS_STALE_TIME = 1000 * 60 * 15; // 15 minutos de caché para estadísticas

export default function ProfileScreen() {
  const { t, mode, setTheme } = useTheme();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [seriesBreakdownVisible, setSeriesBreakdownVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ 
    title: string, 
    date: string, 
    items: { label: string, subLabel?: string, icon?: string, image?: string }[] 
  } | null>(null);

  // Queries - Consolidated Dashboard (Summary + Activity + Progress)
  const { data: user, refetch: refetchUserMe } = useQuery({ 
    queryKey: ['userMe'], 
    queryFn: authApi.getMe,
    staleTime: STATS_STALE_TIME
  });

  const { data: dashboard, isLoading: loadingDashboard, isRefetching: refetchingDashboard } = useQuery({ 
    queryKey: ['statsDashboard'], 
    queryFn: statsApi.getDashboard,
    staleTime: STATS_STALE_TIME
  });

  // Secondary Queries (Lower priority / Below fold)
  const { data: habitCalendar } = useQuery({ 
    queryKey: ['habitsCalendar'], 
    queryFn: statsApi.getHabitsCalendar,
    staleTime: STATS_STALE_TIME 
  });
  
  const { data: genres } = useQuery({ 
    queryKey: ['genres'], 
    queryFn: statsApi.getGenres,
    staleTime: STATS_STALE_TIME
  });

  const { data: booksMonthly } = useQuery({ 
    queryKey: ['monthlyBooks'], 
    queryFn: () => statsApi.getMonthlyItems('books'),
    staleTime: STATS_STALE_TIME
  });

  const { data: moviesMonthly } = useQuery({ 
    queryKey: ['monthlyMovies'], 
    queryFn: () => statsApi.getMonthlyItems('movies'),
    staleTime: STATS_STALE_TIME
  });

  const { data: legendProfile } = useQuery({ 
    queryKey: ['legendProfile'], 
    queryFn: statsApi.getLegendProfile,
    staleTime: STATS_STALE_TIME
  });

  const { data: monthlyHighlight } = useQuery({ 
    queryKey: ['monthlyHighlight'], 
    queryFn: () => statsApi.getMonthlyHighlight(),
    staleTime: STATS_STALE_TIME
  });

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['statsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['userMe'] });
    // Refetch the rest in background
    queryClient.invalidateQueries({ queryKey: ['habitsCalendar'] });
    queryClient.invalidateQueries({ queryKey: ['genres'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyBooks'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyMovies'] });
    queryClient.invalidateQueries({ queryKey: ['legendProfile'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyHighlight'] });
  }, [queryClient]);

  const formatTotalTime = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    
    let result = "";
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (mins > 0 && days === 0) result += `${mins}min`;
    return result.trim() || "0 min";
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        queryClient.clear();
        router.replace('/(auth)/login');
      }}
    ]);
  };

  if (loadingDashboard && !refetchingDashboard) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.accent} size="large" />
      </View>
    );
  }

  const { summary, activity, progress } = dashboard || { summary: null, activity: [], progress: [] };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refetchingDashboard} onRefresh={onRefresh} tintColor={t.accent} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableScale 
              onPress={() => setEditModalVisible(true)}
              style={[styles.avatar, { backgroundColor: t.panel, borderColor: t.ring }]}
              haptic="light"
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarInitial, { color: t.accent }]}>
                  {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
              <View style={[styles.editAvatarBadge, { backgroundColor: t.accent }]}>
                <Text style={{ color: '#fff', fontSize: 10 }}>✎</Text>
              </View>
            </TouchableScale>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: t.ink }]}>{user?.display_name || 'Usuario'}</Text>
              <LegendTitleBadge title={legendProfile?.active_title || null} />
              <Text style={[styles.userEmail, { color: t.muted, fontSize: 11, marginTop: 4, textAlign: 'center' }]}>{user?.email}</Text>
            </View>
            <TouchableScale onPress={handleLogout} style={styles.logoutBtn} haptic="medium">
              <Text style={[styles.logoutText, { color: t.accent }]}>Salir</Text>
            </TouchableScale>
          </View>

          {user?.bio && (
            <View style={styles.bioContainer}>
              <Text style={[styles.userBio, { color: t.muted }]}>"{user.bio}"</Text>
            </View>
          )}

          {/* Theme Selector */}
          <View style={styles.section}>
            <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: 16 }]}>GALERÍA DE ESTÉTICA</Text>
            <View style={[styles.themeGallery, { backgroundColor: t.panel, borderColor: t.ring }]}>
              <ThemeSwatch label="Claro" value="light" active={mode === 'light'} theme={t} onSelect={setTheme} bg="#f5f4ed" accent="#c96442" />
              <ThemeSwatch label="Oscuro" value="dark" active={mode === 'dark'} theme={t} onSelect={setTheme} bg="#1a1813" accent="#e07a52" />
              <ThemeSwatch label="Nocturno" value="midnight" active={mode === 'midnight'} theme={t} onSelect={setTheme} bg="#0c121a" accent="#b99d6b" />
              <ThemeSwatch label="Sistema" value="system" active={mode === 'system'} theme={t} onSelect={setTheme} bg={t.bg} accent={t.muted} isSystem />
            </View>
          </View>

          {/* Monthly Chronicle Button */}
          <View style={styles.section}>
            <TouchableScale 
              onPress={() => setReportModalVisible(true)}
              style={[styles.chronicleBtn, { backgroundColor: t.panel, borderColor: t.ring }]}
              haptic="medium"
              scaleTo={0.98}
            >
              <View style={styles.chronicleContent}>
                <Text style={[styles.chronicleTitle, { color: t.ink }]}>CRÓNICA DE LEYENDAS</Text>
                <Text style={[styles.chronicleSub, { color: t.muted }]}>Ver tu balance de {format(new Date(), 'MMMM')}</Text>
              </View>
              <Text style={{ fontSize: 24 }}>📜</Text>
            </TouchableScale>
          </View>

          {/* Stats Summary */}
          <View style={[styles.statsGrid, { borderColor: t.ring }]}>
            <StatItem label="LIBROS" value={summary?.books_read || 0} color={t.ink} />
            <StatItem label="PELÍCULAS" value={summary?.movies_watched || 0} color={t.ink} />
            <StatItem label="SERIES" value={summary?.series_watched || 0} color={t.ink} />
            <RatingStatItem label="MEDIA" rating={summary?.avg_book_rating ?? null} color={t.ink} accent={t.accent} />
          </View>
          
          <MonthlyHighlightCard 
            highlight={monthlyHighlight || null} 
            onPress={() => setStoryModalVisible(true)}
          /> 

          {/* Screen Time Metric */}
          {summary && summary.total_series_minutes > 0 && (
            <View style={styles.section}>
              <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: 16 }]}>TIEMPO EN PANTALLA</Text>
              <TouchableScale 
                onPress={() => setSeriesBreakdownVisible(true)}
                style={[styles.timeContainer, { backgroundColor: t.panel, borderColor: t.ring }]}
                haptic="light"
                scaleTo={0.98}
              >
                <View style={styles.timeIconBox}>
                  <Text style={{ fontSize: 24 }}>⏳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.timeValue, { color: t.ink }]}>{formatTotalTime(summary.total_series_minutes)}</Text>
                    <Text style={{ color: t.accent, fontSize: 12, fontWeight: 'bold' }}>DETALLES →</Text>
                  </View>
                  <Text style={[styles.timeSub, { color: t.muted }]}>Invertidos en series y anime</Text>
                </View>
              </TouchableScale>
            </View>
          )}

          {/* Reading Goal */}
          {user?.annual_reading_goal > 0 && booksMonthly && (
            <View style={styles.section}>
              <MonthlyGoalChart
                type="books"
                annualGoal={user.annual_reading_goal}
                data={booksMonthly}
                title={`META LECTURA · ${new Date().getFullYear()}`}
                theme={t}
              />
            </View>
          )}

          {/* Movie Goal */}
          {user?.annual_movie_goal > 0 && moviesMonthly && (
            <View style={styles.section}>
              <MonthlyGoalChart
                type="movies"
                annualGoal={user.annual_movie_goal}
                data={moviesMonthly}
                title={`META CINE · ${new Date().getFullYear()}`}
                theme={t}
              />
            </View>
          )}

          {/* Reading Progress Chart */}
          {progress && progress.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: 16 }]}>LECTURA · ÚLTIMOS 15 DÍAS</Text>
              <View style={[styles.chartContainer, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <ReadingChart 
                  data={progress} 
                  color={t.accent} 
                  onPressBar={(p) => setSelectedDayDetail({
                    title: 'Lectura Diaria',
                    date: format(new Date(p.date), 'dd MMMM'),
                    items: p.details.map(d => ({ 
                      label: d.book_title, 
                      subLabel: `${d.pages} páginas`,
                      image: d.cover_url
                    }))
                  })}
                />
              </View>
            </View>
          )}

          {/* Habit Heatmap */}
          {habitCalendar && (
            <View style={styles.section}>
              <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: 16 }]}>CONSTANCIA · HÁBITOS</Text>
              <View style={[styles.heatmapContainer, { backgroundColor: t.panel, borderColor: t.ring }]}>
                <HabitHeatmap 
                  data={habitCalendar} 
                  color={t.accent} 
                  onPressSquare={(d) => setSelectedDayDetail({
                    title: 'Hábitos Completados',
                    date: format(new Date(d.date), 'EEEE, dd MMM'),
                    items: d.habits.length > 0 
                      ? d.habits.map(h => ({ 
                          label: h.name, 
                          icon: h.icon,
                          image: h.image_url 
                        }))
                      : [{ label: 'Ningún hábito completado' }]
                  })}
                />
              </View>
            </View>
          )}

          {/* Genre Chart */}
          {genres && (genres.books.length > 0 || genres.movies.length > 0) && (
            <View style={styles.section}>
              <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: 16 }]}>GÉNEROS FAVORITOS</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <GenreColumn title="Libros" data={genres.books} color={t.accent} ink={t.ink} muted={t.muted} panel={t.panel} ring={t.ring} />
                <GenreColumn title="Películas" data={genres.movies} color={t.accent} ink={t.ink} muted={t.muted} panel={t.panel} ring={t.ring} />
              </View>
            </View>
          )}

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={[typography.styles.eyebrow, { color: t.muted, marginBottom: 16 }]}>ACTIVIDAD RECIENTE</Text>
            <View style={styles.activityList}>
              {activity && activity.length === 0 ? (
                <Text style={[styles.emptyText, { color: t.muted }]}>No hay actividad reciente.</Text>
              ) : (
                activity?.map((event, index) => (
                  <ActivityRow 
                    key={event.id + index} 
                    event={event} 
                    isLast={index === activity.length - 1} 
                    theme={t} 
                  />
                ))
              )}
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <MonthlyReportModal 
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        year={new Date().getFullYear()}
        month={new Date().getMonth() + 1}
      />

      <SeriesBreakdownModal
        visible={seriesBreakdownVisible}
        onClose={() => setSeriesBreakdownVisible(false)}
      />

      <MonthlyStoryModal
        visible={storyModalVisible}
        onClose={() => setStoryModalVisible(false)}
        highlight={monthlyHighlight || null}
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedDayDetail} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDayDetail(null)}>
          <View style={[styles.modalContent, { backgroundColor: t.panel, borderColor: t.ring }]}>
            <Text style={[styles.modalTitle, { color: t.ink }]}>{selectedDayDetail?.title}</Text>
            <Text style={[styles.modalDate, { color: t.muted }]}>{selectedDayDetail?.date}</Text>
            <View style={[styles.modalDivider, { backgroundColor: t.ring }]} />
            
            {selectedDayDetail?.items.map((item, i) => (
              <View key={i} style={styles.modalItem}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.modalItemImg} />
                ) : item.icon ? (
                  <Text style={styles.modalItemIcon}>{item.icon}</Text>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalItemLabel, { color: t.ink }]} numberOfLines={1}>{item.label}</Text>
                  {item.subLabel && <Text style={[styles.modalItemSub, { color: t.muted }]}>{item.subLabel}</Text>}
                </View>
              </View>
            ))}
            
            <TouchableOpacity onPress={() => setSelectedDayDetail(null)} style={styles.modalCloseBtn}>
              <Text style={{ color: t.accent, fontWeight: '600' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <EditProfileModal 
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user || null}
        onUpdate={() => {
          refetchUserMe();
          refreshUser();
        }}
      />
    </View>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

const StatItem = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RatingStatItem = ({ label, rating, color, accent }: { label: string, rating: number | null, color: string, accent: string }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color: rating !== null ? accent : color }]}>
      {rating !== null ? `★ ${rating.toFixed(1)}` : '—'}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ThemeSwatch = ({ 
  label, value, active, theme, onSelect, bg, accent, isSystem 
}: { 
  label: string, value: ThemeMode, active: boolean, theme: any, onSelect: (m: ThemeMode) => void, bg: string, accent: string, isSystem?: boolean 
}) => (
  <TouchableScale 
    onPress={() => onSelect(value)}
    style={[styles.swatchItem]}
    haptic="light"
  >
    <View style={[
      styles.swatchCircle, 
      { backgroundColor: bg, borderColor: active ? theme.accent : theme.ring },
      active && { borderWidth: 2 }
    ]}>
      {isSystem ? (
        <Text style={{ fontSize: 10, color: accent }}>🌓</Text>
      ) : (
        <View style={[styles.swatchAccent, { backgroundColor: accent }]} />
      )}
    </View>
    <Text style={[styles.swatchLabel, { color: active ? theme.ink : theme.muted }]}>{label}</Text>
  </TouchableScale>
);

const ReadingChart = ({ data, color, onPressBar }: { data: ReadingProgressPoint[], color: string, onPressBar: (p: ReadingProgressPoint) => void }) => {
  const last15Days = Array.from({ length: 15 }).map((_, i) => {
    const d = subDays(new Date(), 14 - i);
    const point = data.find(p => isSameDay(new Date(p.date), d));
    return point || { date: d.toISOString(), total_pages: 0, details: [] };
  });

  const maxPages = Math.max(...last15Days.map(p => p.total_pages), 50);

  return (
    <View style={styles.chart}>
      {last15Days.map((point, i) => {
        const date = new Date(point.date);
        const isToday = isSameDay(date, new Date());
        
        return (
          <TouchableScale 
            key={i} 
            onPress={() => point.total_pages > 0 && onPressBar(point as ReadingProgressPoint)}
            style={styles.barWrapper}
            haptic="light"
            scaleTo={0.92}
          >
            <View 
              style={[
                styles.bar, 
                { 
                  height: `${(point.total_pages / maxPages) * 100}%`, 
                  backgroundColor: point.total_pages > 0 ? color : 'transparent',
                  opacity: isToday ? 1 : 0.6,
                  borderWidth: point.total_pages === 0 && isToday ? 1 : 0,
                  borderColor: color,
                  borderStyle: 'dashed'
                }
              ]} 
            />
            {(i % 4 === 0 || i === 14) && (
              <Text style={[styles.barLabel, { fontWeight: isToday ? '700' : '400' }]}>
                {format(date, 'd MMM')}
              </Text>
            )}
          </TouchableScale>
        );
      })}
    </View>
  );
};

const RAINBOW_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00CC44', '#0088FF', '#7B2FBE'] as const;

const HabitHeatmap = ({ data, color, onPressSquare }: { data: HabitCalendarDay[], color: string, onPressSquare: (d: HabitCalendarDay) => void }) => {
  const days = eachDayOfInterval({
    start: startOfWeek(subDays(new Date(), 34)),
    end: endOfWeek(new Date())
  });

  return (
    <View>
      <View style={styles.heatmap}>
        {days.map((day, i) => {
          const point = data.find(p => isSameDay(new Date(p.date), day));
          const count = point ? point.count : 0;
          const target = point ? point.target_count : 1;
          const percentage = count / Math.max(target, 1);

          if (percentage >= 1) {
            return (
              <TouchableScale key={i} onPress={() => point && onPressSquare(point)} style={styles.heatSquare} haptic="light">
                <LinearGradient
                  colors={RAINBOW_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </TouchableScale>
            );
          }

          const opacity = count === 0 ? 0.08 : Math.min(0.2 + percentage * 0.8, 1);
          return (
            <TouchableScale
              key={i}
              onPress={() => point && onPressSquare(point)}
              style={[styles.heatSquare, { backgroundColor: color, opacity }]}
              haptic="light"
            />
          );
        })}
      </View>
      <View style={styles.heatmapLegend}>
        <Text style={styles.legendText}>Incompleto</Text>
        <View style={[styles.heatSquare, { backgroundColor: color, opacity: 0.3 }]} />
        <View style={[styles.heatSquare, { backgroundColor: color, opacity: 0.7 }]} />
        <View style={styles.heatSquare}>
          <LinearGradient
            colors={RAINBOW_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <Text style={styles.legendText}>🌈 Objetivo logrado</Text>
      </View>
    </View>
  );
};

const GenreColumn = ({
  title, data, color, ink, muted, panel, ring
}: {
  title: string;
  data: { genre: string; count: number }[];
  color: string;
  ink: string;
  muted: string;
  panel: string;
  ring: string;
}) => {
  const top5 = data.slice(0, 5);
  const maxCount = top5.length > 0 ? Math.max(...top5.map(g => g.count)) : 1;

  return (
    <View style={{ flex: 1, backgroundColor: panel, borderWidth: 1, borderColor: ring, borderRadius: 12, padding: 12 }}>
      <Text style={{ fontSize: 10, fontFamily: typography.fonts.sans, color: muted, letterSpacing: 1, marginBottom: 10 }}>{title.toUpperCase()}</Text>
      {top5.length === 0 ? (
        <Text style={{ fontSize: 12, fontFamily: typography.fonts.sans, color: muted, fontStyle: 'italic' }}>Sin datos</Text>
      ) : (
        top5.map((item, i) => {
          const pct = maxCount > 0 ? item.count / maxCount : 0;
          return (
            <View key={i} style={{ marginBottom: i < top5.length - 1 ? 8 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 11, fontFamily: typography.fonts.sans, color: ink, flex: 1 }} numberOfLines={1}>{item.genre}</Text>
                <Text style={{ fontSize: 10, fontFamily: typography.fonts.sans, color: muted, marginLeft: 4 }}>{item.count}</Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: ring, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 2, backgroundColor: color, width: `${pct * 100}%` }} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const ActivityRow = ({ event, isLast, theme }: { event: any, isLast: boolean, theme: any }) => {
  const isFinance = event.type === 'finance_transaction';
  const isProgress = event.type === 'reading_progress' || event.type === 'series_progress';
  
  const icon = 
    event.type === 'book_finished' ? '📕' : 
    event.type === 'movie_watched' ? '🎬' : 
    event.type === 'reading_progress' ? '📖' :
    event.type === 'series_progress' ? '📺' :
    isFinance ? '💰' : '✨';

  const isIncome = isFinance && event.detail?.toLowerCase().includes('ingreso');

  return (
    <View style={styles.activityRow}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: isFinance ? (isIncome ? '#4caf50' : theme.accent) : theme.accent }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: theme.ring }]} />}
      </View>
      <View style={[
        styles.activityCard, 
        { backgroundColor: theme.panel, borderColor: theme.ring },
        isFinance && { borderLeftWidth: 3, borderLeftColor: isIncome ? '#4caf50' : theme.accent }
      ]}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.activityImg} resizeMode="cover" />
        ) : (
          <View style={[styles.activityIconPlaceholder, { backgroundColor: theme.bg }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </View>
        )}
        <View style={styles.activityContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.activityTitle, { color: theme.ink, flex: 1 }]} numberOfLines={1}>{event.title}</Text>
            {event.minutes_spent > 0 && (
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.accent, marginLeft: 4 }}>
                +{event.minutes_spent} min
              </Text>
            )}
          </View>
          <Text style={[styles.activityDetail, { color: theme.muted }]}>{event.detail}</Text>
          <View style={styles.activityMeta}>
            <Text style={[styles.activityTime, { color: theme.muted }]}>
              {format(new Date(event.timestamp), 'dd MMM · HH:mm')}
            </Text>
            {isProgress && <View style={[styles.miniBadge, { backgroundColor: theme.accent + '20' }]}><Text style={{fontSize: 9, color: theme.accent}}>{event.type === 'series_progress' ? 'SERIE' : 'LECTURA'}</Text></View>}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24 },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  editAvatarBadge: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f5f4ed' },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 28, fontWeight: '600' },
  userInfo: { flex: 1, marginLeft: 20 },
  userName: { fontSize: 24, fontFamily: typography.fonts.serif, fontWeight: '500' },
  userEmail: { fontSize: 12, fontFamily: typography.fonts.sans },
  bioContainer: { marginBottom: 32, paddingHorizontal: 12 },
  userBio: { fontSize: 15, fontFamily: typography.fonts.sans, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },

  themeGallery: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
  swatchItem: { alignItems: 'center', flex: 1 },
  swatchCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  swatchAccent: { width: 12, height: 12, borderRadius: 6 },
  swatchLabel: { fontSize: 10, fontFamily: typography.fonts.sans, fontWeight: '500' },

  statsGrid: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 20, marginBottom: 32 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: typography.fonts.serif, marginBottom: 4 },
  statLabel: { fontSize: 9, color: '#8a8478', letterSpacing: 1 },

  chronicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  chronicleContent: { flex: 1 },
  chronicleTitle: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
  chronicleSub: { fontSize: 13, fontStyle: 'italic' },

  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  timeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 24,
    fontFamily: typography.fonts.serif,
    fontWeight: '600',
  },
  timeSub: {
    fontSize: 13,
    marginTop: 2,
  },

  section: { marginBottom: 32 },
  chartContainer: { height: 120, borderRadius: 12, borderWidth: 1, padding: 16, justifyContent: 'flex-end' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' },
  barWrapper: { width: '5.5%', alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2 },
  barLabel: { fontSize: 8, color: '#8a8478', marginTop: 4, position: 'absolute', bottom: -14, width: 40, textAlign: 'center' },

  heatmapContainer: { padding: 16, borderRadius: 12, borderWidth: 1 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heatSquare: { width: 14, height: 14, borderRadius: 2, overflow: 'hidden' },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, gap: 4 },
  legendText: { fontSize: 10, color: '#8a8478', marginRight: 4 },

  activityList: { marginTop: 8 },
  activityRow: { flexDirection: 'row', minHeight: 80 },
  timeline: { width: 24, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 12 },
  line: { width: 1, flex: 1 },
  activityCard: { flex: 1, marginLeft: 8, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' },
  activityImg: { width: 44, height: 64, borderRadius: 6, marginRight: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  activityIconPlaceholder: { width: 44, height: 64, borderRadius: 6, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontFamily: typography.fonts.sans, fontWeight: '600', marginBottom: 2 },
  activityDetail: { fontSize: 13, fontFamily: typography.fonts.sans, marginBottom: 6, lineHeight: 18 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityTime: { fontSize: 11, fontFamily: typography.fonts.sans, opacity: 0.8 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontFamily: typography.fonts.serif, fontWeight: '600', marginBottom: 4 },
  modalDate: { fontSize: 14, fontFamily: typography.fonts.sans, marginBottom: 16 },
  modalDivider: { height: 1, marginBottom: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalItemImg: { width: 36, height: 50, borderRadius: 4, marginRight: 12 },
  modalItemIcon: { fontSize: 24, marginRight: 12, width: 36, textAlign: 'center' },
  modalItemLabel: { fontSize: 16, fontWeight: '500' },
  modalItemSub: { fontSize: 13 },
  modalCloseBtn: { marginTop: 12, alignSelf: 'flex-end', padding: 8 }
});
