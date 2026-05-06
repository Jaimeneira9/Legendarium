import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  category_id: string | null;
  merchant: string | null;
  description: string | null;
  date: string;
  is_income: boolean;
  raw_text: string | null;
  category?: Category;
}

export interface FinanceStats {
  total_spent: number;
  total_income: number;
  balance: number;
  by_category: {
    name: string;
    amount: number;
    color: string;
    percentage: number;
  }[];
  daily_spending: {
    date: string;
    amount: number;
  }[];
  insights: string[];
}

export interface FinanceReport {
  has_data: boolean;
  period: string;
  summary: {
    income: number;
    spent: number;
    balance: number;
  };
  top_category: {
    name: string;
    amount: number;
    percentage: number;
  };
  critical_day: {
    date: string;
    amount: number;
  };
  insights: Array<{
    type: 'warning' | 'critical' | 'success';
    title: string;
    desc: string;
  }>;
  by_category: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  message?: string;
}

export const financeApi = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/finance/categories');
    return response.data;
  },

  async getTransactions(year?: number, month?: number): Promise<Transaction[]> {
    const params = year && month ? { year, month } : {};
    const response = await apiClient.get<Transaction[]>('/finance/transactions', { params });
    return response.data;
  },

  async getStats(year?: number, month?: number): Promise<FinanceStats> {
    const params = year && month ? { year, month } : {};
    const response = await apiClient.get<FinanceStats>('/finance/stats', { params });
    return response.data;
  },

  async getReport(year: number, month: number): Promise<FinanceReport> {
    const response = await apiClient.get<FinanceReport>(`/finance/report/${year}/${month}`);
    return response.data;
  },

  async addTransaction(tx: Partial<Transaction>) {
    const response = await apiClient.post<Transaction>('/finance/transactions', tx);
    return response.data;
  },
  
  async updateTransaction(id: string, tx: Partial<Transaction>) {
    const response = await apiClient.patch<Transaction>(`/finance/transactions/${id}`, tx);
    return response.data;
  },

  async deleteTransaction(id: string) {
    await apiClient.delete(`/finance/transactions/${id}`);
  }
};
