import { create } from 'zustand';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '@/types';
import * as db from '@/services/database';
import { supabase, syncRecurringTransactions } from '@/services/supabase';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

const getCloudUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

interface RecurringState {
  recurringTransactions: RecurringTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRecurringTransactions: () => Promise<void>;
  addRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'lastProcessed'>) => Promise<void>;
  updateRecurringTransaction: (recurring: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  toggleRecurringActive: (id: string) => Promise<void>;
  processDueTransactions: (addTransaction: (data: any) => Promise<void>) => Promise<number>;
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const calculateNextOccurrence = (currentDate: string, frequency: RecurringFrequency): string => {
  const date = new Date(currentDate);
  let nextDate: Date;

  switch (frequency) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    case 'yearly':
      nextDate = addYears(date, 1);
      break;
    default:
      nextDate = addMonths(date, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
};

export const useRecurring = create<RecurringState>((set, get) => ({
  recurringTransactions: [],
  isLoading: false,
  error: null,

  loadRecurringTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const recurringTransactions = await db.getAllRecurringTransactions();
      set({ recurringTransactions, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load recurring transactions';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addRecurringTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const recurring: RecurringTransaction = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await db.addRecurringTransaction(recurring);
      set(state => ({
        recurringTransactions: [...state.recurringTransactions, recurring],
        isLoading: false,
      }));
      const userId = await getCloudUserId();
      if (userId) syncRecurringTransactions(userId, [recurring]).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add recurring transaction';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateRecurringTransaction: async (recurring) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateRecurringTransaction(recurring);
      set(state => ({
        recurringTransactions: state.recurringTransactions.map(r =>
          r.id === recurring.id ? recurring : r
        ),
        isLoading: false,
      }));
      const userId = await getCloudUserId();
      if (userId) syncRecurringTransactions(userId, [recurring]).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update recurring transaction';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteRecurringTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteRecurringTransaction(id);
      set(state => ({
        recurringTransactions: state.recurringTransactions.filter(r => r.id !== id),
        isLoading: false,
      }));
      // Delete from cloud in background
      const userId = await getCloudUserId();
      if (userId) {
        supabase.from('recurring_transactions').delete().eq('id', id).then(() => {});
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete recurring transaction';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  toggleRecurringActive: async (id) => {
    const { recurringTransactions } = get();
    const recurring = recurringTransactions.find(r => r.id === id);
    if (!recurring) return;

    const updated = { ...recurring, isActive: !recurring.isActive };
    await get().updateRecurringTransaction(updated);
  },

  processDueTransactions: async (addTransaction) => {
    try {
      const dueTransactions = await db.getDueRecurringTransactions();
      let processedCount = 0;

      for (const recurring of dueTransactions) {
        // Create actual transaction
        await addTransaction({
          type: recurring.type,
          amount: recurring.amount,
          categoryId: recurring.categoryId,
          accountId: recurring.accountId,
          toAccountId: recurring.toAccountId,
          note: recurring.note ? `${recurring.note} (auto)` : '(automatyczna)',
          date: recurring.nextOccurrence,
        });

        // Update recurring transaction
        const nextOccurrence = calculateNextOccurrence(recurring.nextOccurrence, recurring.frequency);
        const updated: RecurringTransaction = {
          ...recurring,
          nextOccurrence,
          lastProcessed: new Date().toISOString(),
        };
        await db.updateRecurringTransaction(updated);
        processedCount++;
      }

      // Reload to get updated state
      await get().loadRecurringTransactions();

      return processedCount;
    } catch (error) {
      console.error('Error processing due transactions:', error);
      throw error;
    }
  },
}));
