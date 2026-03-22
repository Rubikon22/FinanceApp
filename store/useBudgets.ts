import { create } from 'zustand';
import { Budget } from '@/types';
import * as db from '@/services/database';
import { supabase, syncBudgets, deleteBudgetFromCloud } from '@/services/supabase';

const getCloudUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean; // > 80%
}

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBudgets: () => Promise<void>;
  addBudget: (categoryId: string, amount: number, period: 'month' | 'year') => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetByCategoryId: (categoryId: string) => Budget | undefined;

  // Getters - need expenses map from transactions store
  calculateBudgetProgress: (expensesByCategory: Map<string, number>) => BudgetProgress[];
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const useBudgets = create<BudgetsState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  loadBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const budgets = await db.getAllBudgets();
      set({ budgets, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load budgets';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addBudget: async (categoryId, amount, period) => {
    set({ isLoading: true, error: null });
    try {
      const budget: Budget = {
        id: generateId(),
        categoryId,
        amount,
        period,
        createdAt: new Date().toISOString(),
      };
      await db.addBudget(budget);
      set(state => ({
        budgets: [
          ...state.budgets.filter(b => b.categoryId !== categoryId),
          budget,
        ],
        isLoading: false,
      }));
      const userId = await getCloudUserId();
      if (userId) syncBudgets(userId, [budget]).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add budget';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateBudget: async (budget) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateBudget(budget);
      set(state => ({
        budgets: state.budgets.map(b => b.id === budget.id ? budget : b),
        isLoading: false,
      }));
      const userId = await getCloudUserId();
      if (userId) syncBudgets(userId, [budget]).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update budget';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteBudget(id);
      set(state => ({
        budgets: state.budgets.filter(b => b.id !== id),
        isLoading: false,
      }));
      deleteBudgetFromCloud(id).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete budget';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getBudgetByCategoryId: (categoryId) => {
    return get().budgets.find(b => b.categoryId === categoryId);
  },

  calculateBudgetProgress: (expensesByCategory) => {
    const { budgets } = get();

    return budgets.map(budget => {
      const spent = expensesByCategory.get(budget.categoryId) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > budget.amount,
        isNearLimit: percentage >= 80 && percentage < 100,
      };
    });
  },
}));
