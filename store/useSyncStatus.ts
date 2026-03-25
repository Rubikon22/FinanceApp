import { create } from 'zustand';

export type SyncState = 'idle' | 'syncing' | 'error' | 'success' | 'offline';

interface SyncStatusState {
  syncState: SyncState;
  errorMessage: string | null;
  lastSyncAt: Date | null;
  pendingCount: number; // number of unsynced local records

  setSyncing: () => void;
  setSyncError: (message: string) => void;
  setSyncSuccess: () => void;
  setOffline: (pending: number) => void;
  clearError: () => void;
  setPendingCount: (count: number) => void;
}

export const useSyncStatus = create<SyncStatusState>((set) => ({
  syncState: 'idle',
  errorMessage: null,
  lastSyncAt: null,
  pendingCount: 0,

  setSyncing: () => set({ syncState: 'syncing', errorMessage: null }),
  setSyncError: (errorMessage) => set({ syncState: 'error', errorMessage }),
  setSyncSuccess: () => set({ syncState: 'success', errorMessage: null, lastSyncAt: new Date() }),
  setOffline: (pendingCount) => set({ syncState: 'offline', errorMessage: null, pendingCount }),
  clearError: () => set({ syncState: 'idle', errorMessage: null }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
}));
