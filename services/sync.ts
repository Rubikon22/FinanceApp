import { useAuth } from '@/store/useAuth';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import * as firebase from './firebase';
import * as database from './database';

export const syncWithCloud = async (): Promise<void> => {
  const user = useAuth.getState().user;
  if (!user) return;

  try {
    // Sync transactions
    const localTransactions = await database.getAllTransactions();
    const unsyncedTransactions = localTransactions.filter(t => !t.synced);

    if (unsyncedTransactions.length > 0) {
      await firebase.syncTransactions(user.id, unsyncedTransactions);

      // Mark as synced locally
      for (const transaction of unsyncedTransactions) {
        await database.updateTransaction({
          ...transaction,
          synced: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Fetch cloud transactions
    const cloudTransactions = await firebase.fetchTransactions(user.id);

    // Merge cloud transactions with local
    for (const cloudTx of cloudTransactions) {
      const localTx = localTransactions.find(t => t.id === cloudTx.id);
      if (!localTx) {
        await database.addTransaction(cloudTx);
      }
    }

    // Sync accounts
    const localAccounts = await database.getAllAccounts();
    await firebase.syncAccounts(user.id, localAccounts);

    // Fetch cloud accounts
    const cloudAccounts = await firebase.fetchAccounts(user.id);

    // Merge cloud accounts with local
    for (const cloudAcc of cloudAccounts) {
      const localAcc = localAccounts.find(a => a.id === cloudAcc.id);
      if (!localAcc) {
        await database.addAccount(cloudAcc);
      }
    }

    // Reload stores
    await useTransactions.getState().loadTransactions();
    await useAccounts.getState().loadAccounts();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    console.error('Sync error:', message);
    throw new Error(`Sync failed: ${message}`);
  }
};

export const setupAuthListener = (): (() => void) => {
  return firebase.onAuthChange((user) => {
    useAuth.getState().setUser(user);

    if (user) {
      // Sync when user logs in
      syncWithCloud().catch(console.error);
    }
  });
};
