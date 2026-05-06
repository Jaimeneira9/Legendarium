import { apiClient } from './client';

export interface BookSearchResult {
  google_books_id: string;
  title: string;
  authors: string[];
  published_date?: string;
  cover_url?: string;
  description?: string;
  categories: string[];
  page_count?: number;
}

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'dropped';

export interface UserBookCreate {
  google_books_id: string;
  status: BookStatus;
  format?: 'physical' | 'electronic';
  started_at?: string;
  finished_at?: string;
}

export interface UserBookUpdate {
  status?: BookStatus;
  rating?: number;
  current_page?: number;
  progress_percentage?: number;
  notes?: string;
  started_at?: string;
  finished_at?: string;
}

export interface UserBook {
  id: string;
  status: BookStatus;
  rating?: number;
  current_page: number;
  progress_percentage?: number;
  notes?: string;
  started_at?: string;
  finished_at?: string;
  google_books_id: string;
  title: string;
  authors: string[];
  cover_url?: string;
  page_count?: number;
  published_date?: string;
  description?: string;
  categories: string[];
}

export const booksApi = {
  searchBooks: async (query: string, lang?: string, author?: string): Promise<BookSearchResult[]> => {
    const response = await apiClient.get<BookSearchResult[]>('/books/search', {
      params: { q: query, lang, author },
    });
    return response.data;
  },

  getBookDetails: async (googleBooksId: string): Promise<BookSearchResult> => {
    const response = await apiClient.get<BookSearchResult>(`/books/${googleBooksId}`);
    return response.data;
  },

  getMyBooks: async (status?: BookStatus, limit = 20, offset = 0): Promise<UserBook[]> => {
    const response = await apiClient.get<UserBook[]>('/me/books', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  addBook: async (data: UserBookCreate): Promise<UserBook> => {
    const response = await apiClient.post<UserBook>('/me/books', data);
    return response.data;
  },

  updateBook: async (id: string, data: UserBookUpdate): Promise<UserBook> => {
    const response = await apiClient.patch<UserBook>(`/me/books/${id}`, data);
    return response.data;
  },

  deleteBook: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/books/${id}`);
  },
};
