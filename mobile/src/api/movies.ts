import { apiClient } from './client';

export interface MovieSearchResult {
  tmdb_id: number;
  title: string;
  original_title?: string;
  poster_url?: string;
  overview?: string;
  release_date?: string;
  genres: string[];
  vote_average?: number;
}

export type MovieStatus = 'want_to_watch' | 'watched' | 'dropped';

export interface UserMovieCreate {
  tmdb_id: number;
  status: MovieStatus;
  rating?: number;
  watched_at?: string;
}

export interface UserMovieUpdate {
  status?: MovieStatus;
  rating?: number;
  notes?: string;
  watched_at?: string;
}

export interface UserMovie {
  id: string;
  status: MovieStatus;
  rating?: number;
  notes?: string;
  watched_at?: string;
  tmdb_id: number;
  title: string;
  poster_url?: string;
  release_date?: string;
}

export const moviesApi = {
  searchMovies: async (query: string, year?: number): Promise<MovieSearchResult[]> => {
    const response = await apiClient.get<MovieSearchResult[]>('/movies/search', {
      params: { q: query, year },
    });
    return response.data;
  },

  searchMulti: async (query: string): Promise<MovieSearchResult[]> => {
    const response = await apiClient.get<MovieSearchResult[]>('/movies/search-multi', {
      params: { q: query },
    });
    return response.data;
  },

  getMyMovies: async (status?: string, limit = 20, offset = 0): Promise<UserMovie[]> => {
    const response = await apiClient.get<UserMovie[]>('/me/movies', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  addMovie: async (data: UserMovieCreate): Promise<UserMovie> => {
    const response = await apiClient.post<UserMovie>('/me/movies', data);
    return response.data;
  },

  updateMovie: async (id: string, data: UserMovieUpdate): Promise<UserMovie> => {
    const response = await apiClient.patch<UserMovie>(`/me/movies/${id}`, data);
    return response.data;
  },

  deleteMovie: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/movies/${id}`);
  },
};
