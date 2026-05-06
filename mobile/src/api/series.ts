import { apiClient as api } from './client';

export interface SeriesSearchResult {
  tmdb_id: number;
  title: string;
  original_title?: string;
  poster_url?: string;
  overview?: string;
  release_date?: string;
  genres: string[];
  vote_average?: number;
}

export interface UserSeriesCreate {
  tmdb_id: number;
  status: 'want_to_watch' | 'watching' | 'watched' | 'dropped';
  rating?: number;
  current_season?: number;
  current_episode?: number;
  last_watched_at?: string;
}

export interface UserSeriesUpdate {
  status?: string;
  rating?: number;
  notes?: string;
  current_season?: number;
  current_episode?: number;
  last_watched_at?: string;
}

export interface UserSeriesResponse {
  id: string;
  status: string;
  rating?: number;
  notes?: string;
  current_season: number;
  current_episode: number;
  last_watched_at?: string;
  tmdb_id: number;
  title: string;
  poster_url?: string;
  release_date?: string;
  total_seasons: number;
  total_episodes: number;
  episode_run_time: number;
  seasons_data: { season_number: number; episode_count: number }[];
}

export const seriesApi = {
  search: async (q: string, year?: number, anime?: boolean): Promise<SeriesSearchResult[]> => {
    const params: any = { q };
    if (year) params.year = year;
    if (anime) params.anime = anime;
    const res = await api.get('/series/search', { params });
    return res.data;
  },
  getMySeries: async (status?: string, limit = 20, offset = 0): Promise<UserSeriesResponse[]> => {
    const res = await api.get('/me/series', { params: { status, limit, offset } });
    return res.data;
  },
  addSeries: async (data: UserSeriesCreate): Promise<UserSeriesResponse> => {
    const res = await api.post('/me/series', data);
    return res.data;
  },
  updateSeries: async (id: string, data: UserSeriesUpdate): Promise<UserSeriesResponse> => {
    const res = await api.patch(`/me/series/${id}`, data);
    return res.data;
  },
  deleteSeries: async (id: string): Promise<void> => {
    await api.delete(`/me/series/${id}`);
  },
};
