import { create } from 'zustand';
import { Transaction, TransactionType, PeriodType } from '@/types';
import * as db from '@/services/database';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

interface SearchFilters {
  query: string;
  type: TransactionType | 'all';
  categoryId: string | null;
  minAmount: number | null;
  maxAmount: number | null;
}

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedDate: Date | null;
  filterPeriod: PeriodType;
  advancedFilters: SearchFilters;

  // Actions
  loadTransactions: () => Promise<void>;
  loadTransactionsByPeriod: (period: PeriodType) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setFilterPeriod: (period: PeriodType) => void;
  setAdvancedFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;

  // Getters
  getFilteredTransactions: () => Transaction[];
  getAdvancedFilteredTransactions: () => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTotalByType: (type: TransactionType) => number;
  getExpensesByCategory: () => Map<string, number>;
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const useTransactions = create<TransactionsState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedDate: null,
  filterPeriod: 'month',
  advancedFilters: {
    query: '',
    type: 'all',
    categoryId: null,
    minAmount: null,
    maxAmount: null,
  },

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await db.getAllTransactions();
      set({ transactions, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load transactions';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadTransactionsByPeriod: async (period: PeriodType) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
      }

      const transactions = await db.getTransactionsByDateRange(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      set({ transactions, isLoading: false, filterPeriod: period });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load transactions';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addTransaction: async (transactionData) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const transaction: Transaction = {
        ...transactionData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        synced: false,
      };
      await db.addTransaction(transaction);
      set(state => ({
        transactions: [transaction, ...state.transactions],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add transaction';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTransaction: async (transaction) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTransaction = {
        ...transaction,
        updatedAt: new Date().toISOString(),
        synced: false,
      };
      await db.updateTransaction(updatedTransaction);
      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transaction.id ? updatedTransaction : t
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update transaction';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteTransaction(id);
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilterPeriod: (period) => set({ filterPeriod: period }),
  setAdvancedFilters: (filters) => set({ advancedFilters: filters }),
  clearFilters: () => set({
    searchQuery: '',
    selectedDate: null,
    advancedFilters: {
      query: '',
      type: 'all',
      categoryId: null,
      minAmount: null,
      maxAmount: null,
    },
  }),

  getFilteredTransactions: () => {
    const { transactions, searchQuery, selectedDate } = get();
    let filtered = transactions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.note?.toLowerCase().includes(query) ||
        t.categoryId.toLowerCase().includes(query)
      );
    }

    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(t => t.date.startsWith(dateStr));
    }

    return filtered;
  },

  getAdvancedFilteredTransactions: () => {
    const { transactions, advancedFilters } = get();
    let filtered = transactions;

    // Text search (notes, category names)
    if (advancedFilters.query) {
      const query = advancedFilters.query.toLowerCase();
      filtered = filtered.filter(t =>
        t.note?.toLowerCase().includes(query) ||
        t.categoryId.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }

    // Type filter
    if (advancedFilters.type !== 'all') {
      filtered = filtered.filter(t => t.type === advancedFilters.type);
    }

    // Category filter
    if (advancedFilters.categoryId) {
      filtered = filtered.filter(t => t.categoryId === advancedFilters.categoryId);
    }

    // Amount range filter
    if (advancedFilters.minAmount !== null) {
      filtered = filtered.filter(t => t.amount >= advancedFilters.minAmount!);
    }
    if (advancedFilters.maxAmount !== null) {
      filtered = filtered.filter(t => t.amount <= advancedFilters.maxAmount!);
    }

    return filtered;
  },

  getTransactionsByType: (type) => {
    return get().transactions.filter(t => t.type === type);
  },

  getTotalByType: (type) => {
    return get().transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getExpensesByCategory: () => {
    const expenses = get().transactions.filter(t => t.type === 'expense');
    const categoryTotals = new Map<string, number>();

    expenses.forEach(t => {
      const current = categoryTotals.get(t.categoryId) || 0;
      categoryTotals.set(t.categoryId, current + t.amount);
    });

    return categoryTotals;
  },
}));
