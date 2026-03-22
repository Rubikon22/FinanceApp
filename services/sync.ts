import { useAuth } from '@/store/useAuth';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { useBudgets } from '@/store/useBudgets';
import { useRecurring } from '@/store/useRecurring';
import {
  syncTransactions,
  fetchTransactions,
  syncAccounts,
  fetchAccounts,
  syncBudgets,
  fetchBudgets,
  syncRecurringTransactions,
  fetchRecurringTransactions,
  onAuthChange,
} from './supabase';
import * as database from './database';

export const syncWithCloud = async (): Promise<void> => {
  const user = useAuth.getState().user;
  if (!user) return;

  try {
    // Upload unsynced local transactions
    const localTransactions = await database.getAllTransactions();
    const unsyncedTransactions = localTransactions.filter(t => !t.synced);

    if (unsyncedTransactions.length > 0) {
      await syncTransactions(user.id, unsyncedTransactions);
      for (const transaction of unsyncedTransactions) {
        await database.updateTransaction({
          ...transaction,
          synced: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Fetch and merge cloud transactions
    const cloudTransactions = await fetchTransactions(user.id);
    const cloudIds = new Set(cloudTransactions.map(t => t.id));

    // Remove local transactions that no longer exist in the cloud (were deleted on another device)
    for (const localTx of localTransactions) {
      if (localTx.synced && !cloudIds.has(localTx.id)) {
        await database.deleteTransaction(localTx.id);
      }
    }

    // Add cloud transactions that don't exist locally
    const updatedLocal = await database.getAllTransactions();
    const localIds = new Set(updatedLocal.map(t => t.id));
    for (const cloudTx of cloudTransactions) {
      if (!localIds.has(cloudTx.id)) {
        await database.addTransaction(cloudTx);
      }
    }

    // Upload accounts
    const localAccounts = await database.getAllAccounts();
    await syncAccounts(user.id, localAccounts);

    // Fetch and merge cloud accounts
    const cloudAccounts = await fetchAccounts(user.id);
    for (const cloudAcc of cloudAccounts) {
      const exists = localAccounts.find(a => a.id === cloudAcc.id);
      if (!exists) {
        await database.addAccount(cloudAcc);
      }
    }

    await useTransactions.getState().loadTransactions();
    await useAccounts.getState().loadAccounts();

    // Sync budgets (non-fatal — table may not exist yet)
    try {
      const localBudgets = await database.getAllBudgets();
      await syncBudgets(user.id, localBudgets);
      const cloudBudgets = await fetchBudgets(user.id);
      for (const cloudBudget of cloudBudgets) {
        const exists = localBudgets.find(b => b.id === cloudBudget.id);
        if (!exists) {
          await database.addBudget(cloudBudget);
        }
      }
      await useBudgets.getState().loadBudgets();
    } catch (e) {
      const msg = (e as any)?.message ?? String(e);
      console.warn('Budgets sync skipped:', msg);
    }

    // Sync recurring transactions (non-fatal — table may not exist yet)
    try {
      const localRecurring = await database.getAllRecurringTransactions();
      await syncRecurringTransactions(user.id, localRecurring);
      const cloudRecurring = await fetchRecurringTransactions(user.id);
      for (const cloudR of cloudRecurring) {
        const exists = localRecurring.find(r => r.id === cloudR.id);
        if (!exists) {
          await database.addRecurringTransaction(cloudR);
        }
      }
      await useRecurring.getState().loadRecurringTransactions();
    } catch (e) {
      const msg = (e as any)?.message ?? String(e);
      console.warn('Recurring transactions sync skipped:', msg);
    }
  } catch (error) {
    const msg = (error as any)?.message ?? String(error);
    console.error('Sync error:', msg);
    throw new Error(`Sync failed: ${msg}`);
  }
};

export const setupAuthListener = (): (() => void) => {
  return onAuthChange((user) => {
    useAuth.getState().setUser(user);
    if (user) {
      syncWithCloud().catch(console.error);
    }
  });
};
