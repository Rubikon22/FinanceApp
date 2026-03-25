import { useAuth } from '@/store/useAuth';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { useBudgets } from '@/store/useBudgets';
import { useRecurring } from '@/store/useRecurring';
import { useSyncStatus } from '@/store/useSyncStatus';
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
import { isOnline, subscribeToNetwork } from './network';

const extractMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  const msg = (error as any)?.message;
  if (typeof msg === 'string') return msg;
  return 'Brak połączenia z siecią';
};

/** Count how many local records are waiting to be synced. */
const countPending = async (): Promise<number> => {
  const txs = await database.getAllTransactions();
  return txs.filter(t => !t.synced).length;
};

export const syncWithCloud = async (): Promise<void> => {
  const user = useAuth.getState().user;
  if (!user) return;

  // Check connectivity before doing anything
  const online = await isOnline();
  if (!online) {
    const pending = await countPending();
    useSyncStatus.getState().setOffline(pending);
    return;
  }

  useSyncStatus.getState().setSyncing();

  try {
    // ── Transactions ──────────────────────────────────────────
    const localTransactions = await database.getAllTransactions();
    const unsyncedTransactions = localTransactions.filter(t => !t.synced);

    if (unsyncedTransactions.length > 0) {
      await syncTransactions(user.id, unsyncedTransactions);
      // Mark as synced in local DB
      for (const transaction of unsyncedTransactions) {
        await database.markTransactionSynced(transaction.id);
      }
    }

    // Fetch cloud transactions and reconcile
    const cloudTransactions = await fetchTransactions(user.id);
    const cloudIds = new Set(cloudTransactions.map(t => t.id));

    // Remove locally-synced transactions deleted elsewhere
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
        await database.addTransaction({ ...cloudTx, synced: true });
      }
    }

    // ── Accounts ──────────────────────────────────────────────
    const localAccounts = await database.getAllAccounts();
    await syncAccounts(user.id, localAccounts);

    const cloudAccounts = await fetchAccounts(user.id);
    for (const cloudAcc of cloudAccounts) {
      if (!localAccounts.find(a => a.id === cloudAcc.id)) {
        await database.addAccount(cloudAcc);
      }
    }

    await useTransactions.getState().loadTransactions();
    await useAccounts.getState().loadAccounts();

    // ── Budgets (non-fatal) ────────────────────────────────────
    try {
      const localBudgets = await database.getAllBudgets();
      await syncBudgets(user.id, localBudgets);
      const cloudBudgets = await fetchBudgets(user.id);
      for (const cloudBudget of cloudBudgets) {
        if (!localBudgets.find(b => b.id === cloudBudget.id)) {
          await database.addBudget(cloudBudget);
        }
      }
      await useBudgets.getState().loadBudgets();
    } catch (e) {
      console.warn('Budgets sync skipped:', extractMessage(e));
    }

    // ── Recurring transactions (non-fatal) ────────────────────
    try {
      const localRecurring = await database.getAllRecurringTransactions();
      await syncRecurringTransactions(user.id, localRecurring);
      const cloudRecurring = await fetchRecurringTransactions(user.id);
      for (const cloudR of cloudRecurring) {
        if (!localRecurring.find(r => r.id === cloudR.id)) {
          await database.addRecurringTransaction(cloudR);
        }
      }
      await useRecurring.getState().loadRecurringTransactions();
    } catch (e) {
      console.warn('Recurring transactions sync skipped:', extractMessage(e));
    }

    useSyncStatus.getState().setSyncSuccess();
  } catch (error) {
    const msg = extractMessage(error);
    console.error('Sync error:', msg);
    useSyncStatus.getState().setSyncError(msg);
  }
};

export const setupAuthListener = (): (() => void) => {
  return onAuthChange((user) => {
    useAuth.getState().setUser(user);
    if (user) {
      syncWithCloud();
    }
  });
};

/**
 * Listen to network changes.
 * When the connection is restored and the user is logged in, auto-sync.
 * Returns an unsubscribe function to call on cleanup.
 */
export const setupNetworkListener = (): (() => void) => {
  let wasOffline = false;

  return subscribeToNetwork(async (online) => {
    const user = useAuth.getState().user;

    if (!online) {
      wasOffline = true;
      if (user) {
        const pending = await countPending();
        useSyncStatus.getState().setOffline(pending);
      }
      return;
    }

    // Just came back online
    if (wasOffline) {
      wasOffline = false;
      if (user) {
        // Small delay to let the connection stabilise
        setTimeout(() => syncWithCloud(), 1500);
      } else {
        useSyncStatus.getState().clearError();
      }
    }
  });
};
