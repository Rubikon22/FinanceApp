import { create } from 'zustand';
import { Account } from '@/types';
import * as db from '@/services/database';
import { Colors } from '@/constants/colors';
import { supabase, syncAccounts, deleteAccountFromCloud } from '@/services/supabase';
import { useSyncStatus } from '@/store/useSyncStatus';

const onSyncError = (error: unknown) => {
  const msg = (error as any)?.message ?? String(error);
  useSyncStatus.getState().setSyncError(msg);
};

const getCloudUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  selectedAccountId: string | null;

  // Actions
  loadAccounts: () => Promise<void>;
  addAccount: (name: string, icon?: string, color?: string) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setSelectedAccountId: (id: string | null) => void;

  // Getters
  getTotalBalance: () => number;
  getAccountById: (id: string) => Account | undefined;
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const useAccounts = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,
  selectedAccountId: null,

  loadAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      let accounts = await db.getAllAccounts();

      // Jeśli nie ma żadnych kont, utwórz domyślne
      if (accounts.length === 0) {
        const defaultAccounts: Account[] = [
          {
            id: generateId(),
            name: 'Gotówka',
            balance: 0,
            icon: 'cash',
            color: '#00B894',
            createdAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            name: 'Karta płatnicza',
            balance: 0,
            icon: 'card',
            color: '#6C5CE7',
            createdAt: new Date().toISOString(),
          },
        ];

        // Dodaj domyślne konta do bazy
        for (const account of defaultAccounts) {
          await db.addAccount(account);
        }

        accounts = defaultAccounts;
      }

      set({ accounts, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load accounts';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addAccount: async (name, icon = 'wallet', color = Colors.primary) => {
    set({ isLoading: true, error: null });
    try {
      const account: Account = {
        id: generateId(),
        name,
        balance: 0,
        icon,
        color,
        createdAt: new Date().toISOString(),
      };
      await db.addAccount(account);
      set(state => ({
        accounts: [...state.accounts, account],
        isLoading: false,
      }));
      const userId = await getCloudUserId();
      if (userId) syncAccounts(userId, [account]).catch(onSyncError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add account';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateAccount: async (account) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateAccount(account);
      set(state => ({
        accounts: state.accounts.map(a => a.id === account.id ? account : a),
        isLoading: false,
      }));
      const userId = await getCloudUserId();
      if (userId) syncAccounts(userId, [account]).catch(onSyncError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update account';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteAccount(id);
      set(state => ({
        accounts: state.accounts.filter(a => a.id !== id),
        isLoading: false,
      }));
      deleteAccountFromCloud(id).catch(onSyncError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setSelectedAccountId: (id) => set({ selectedAccountId: id }),

  getTotalBalance: () => {
    return get().accounts.reduce((sum, account) => sum + account.balance, 0);
  },

  getAccountById: (id) => {
    return get().accounts.find(account => account.id === id);
  },
}));
