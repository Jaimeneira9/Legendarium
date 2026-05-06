import { apiClient } from './client';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: string;
  target_days: number[];
  is_archived: boolean;
  image_url?: string;
  completed_today?: boolean;
  current_streak?: number;
}

export interface HabitCreateData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: string;
  target_days: number[];
  image_url?: string;
}

export const habitApi = {
  getTodayHabits: async (): Promise<Habit[]> => {
    const response = await apiClient.get<Habit[]>('/me/habits/today');
    return response.data;
  },

  createHabit: async (data: HabitCreateData): Promise<Habit> => {
    const response = await apiClient.post<Habit>('/me/habits', data);
    return response.data;
  },

  updateHabit: async (id: string, data: Partial<HabitCreateData>): Promise<Habit> => {
    const response = await apiClient.patch<Habit>(`/me/habits/${id}`, data);
    return response.data;
  },

  deleteHabit: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/habits/${id}`);
  },

  logHabit: async (habitId: string) => {
    const response = await apiClient.post(`/me/habits/${habitId}/log`);
    return response.data;
  },

  unlogHabit: async (habitId: string, dateStr: string) => {
    const response = await apiClient.delete(`/me/habits/${habitId}/log/${dateStr}`);
    return response.data;
  },
};
