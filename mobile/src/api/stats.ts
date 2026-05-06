import { apiClient } from './client';

export interface StatsSummary {
  books_read: number;
  books_reading: number;
  movies_watched: number;
  movies_watchlist: number;
  avg_book_rating: number | null;
  avg_movie_rating: number | null;
  series_watched: number;
  total_series_minutes: number;
}

export interface MonthlyItem {
  title: string;
  cover_url: string | null;
  rating: number | null;
  date: string;
  format?: 'physical' | 'electronic';
}

export interface MonthlyData {
  month: number; // 1-12
  count: number;
  physical_count: number;
  electronic_count: number;
  items: MonthlyItem[];
}

export interface ActivityEvent {
  id: string;
  type: 'book_finished' | 'movie_watched' | 'reading_progress' | 'finance_transaction' | 'series_progress' | 'series_watched';
  title: string;
  detail?: string;
  timestamp: string;
  image_url?: string;
  minutes_spent?: number;
}

export interface ReadingProgressPoint {
  date: string;
  total_pages: number;
  details: { book_title: string; pages: number; cover_url?: string }[];
}

export interface HabitCalendarDay {
  date: string;
  count: number;
  target_count: number;
  habits: { name: string; icon: string; image_url?: string }[];
}

export interface SeriesTimeBreakdown {
  title: string;
  poster_url: string | null;
  minutes_spent: number;
}

export interface HabitAchievement {
  level: string;
  days: number;
}

export interface FinanceAnalysis {
  category: string;
  amount: number;
  percentage: number;
  alert: string | null;
}

export interface MonthlyReport {
  year: number;
  month: number;
  income: number;
  expenses: number;
  balance: number;
  finance_breakdown: FinanceAnalysis[];
  books_finished: number;
  pages_read: number;
  reading_time_minutes: number;
  movies_watched: number;
  movies_time_minutes: number;
  episodes_watched: number;
  series_time_minutes: number;
  total_enjoyment_minutes: number;
  habit_achievements: HabitAchievement[];
}

export interface GenreStats {
  books: { genre: string; count: number }[];
  movies: { genre: string; count: number }[];
}

export interface DashboardStats {
  summary: StatsSummary;
  activity: ActivityEvent[];
  progress: ReadingProgressPoint[];
}

export interface LegendTitle {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress: number;
}

export interface LegendProfile {
  active_title: LegendTitle | null;
  unlocked_titles: LegendTitle[];
  next_title: LegendTitle | null;
}

export interface MonthlyHighlightBook {
  title: string;
  cover_url: string | null;
  rating: number | null;
  authors: string[];
}

export interface MonthlyHighlightMovie {
  title: string;
  poster_url: string | null;
  rating: number | null;
}

export interface MonthlyHighlightHabit {
  name: string;
  icon: string | null;
  streak: number;
}

export interface MonthlyHighlight {
  year: number;
  month: number;
  best_book: MonthlyHighlightBook | null;
  best_movie: MonthlyHighlightMovie | null;
  top_habit: MonthlyHighlightHabit | null;
  pages_read: number;
  books_finished: number;
  movies_watched: number;
  episodes_watched: number;
  reading_time_estimate: string;
}

export const statsApi = {
  getDashboard: async () => {
    const res = await apiClient.get<DashboardStats>('/me/stats/dashboard');
    return res.data;
  },
  getSummary: async () => {
    const res = await apiClient.get<StatsSummary>('/me/stats/summary');
    return res.data;
  },
  getActivity: async () => {
    const res = await apiClient.get<ActivityEvent[]>('/me/stats/activity');
    return res.data;
  },
  getProgress: async () => {
    const res = await apiClient.get<ReadingProgressPoint[]>('/me/stats/progress');
    return res.data;
  },
  getHabitsCalendar: async () => {
    const res = await apiClient.get<HabitCalendarDay[]>('/me/stats/habits-calendar');
    return res.data;
  },
  getGenres: async (): Promise<GenreStats> => {
    const res = await apiClient.get<GenreStats>('/me/stats/genres');
    return res.data;
  },
  getMonthlyItems: async (type: 'books' | 'movies'): Promise<MonthlyData[]> => {
    const res = await apiClient.get<MonthlyData[]>(`/me/stats/monthly-items?type=${type}`);
    return res.data;
  },
  getMonthlyReport: async (year: number, month: number): Promise<MonthlyReport> => {
    const res = await apiClient.get<MonthlyReport>(`/me/stats/report/${year}/${month}`);
    return res.data;
  },
  getSeriesBreakdown: async (): Promise<SeriesTimeBreakdown[]> => {
    const res = await apiClient.get<SeriesTimeBreakdown[]>('/me/stats/series_breakdown');
    return res.data;
  },
  getLegendProfile: async (): Promise<LegendProfile> => {
    const res = await apiClient.get<LegendProfile>('/me/stats/legend-profile');
    return res.data;
  },
  getMonthlyHighlight: async (year?: number, month?: number): Promise<MonthlyHighlight> => {
    let url = '/me/stats/monthly-highlight';
    if (year && month) url += `?year=${year}&month=${month}`;
    const res = await apiClient.get<MonthlyHighlight>(url);
    return res.data;
  },
};
