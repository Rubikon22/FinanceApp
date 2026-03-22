import { useAuth } from '@/store/useAuth';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import {
  syncTransactions,
  fetchTransactions,
  syncAccounts,
  fetchAccounts,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    console.error('Sync error:', message);
    throw new Error(`Sync failed: ${message}`);
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
