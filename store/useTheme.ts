import { create } from 'zustand';
import { ThemeMode } from '@/types';
import * as db from '@/services/database';

interface ThemeState {
  theme: ThemeMode;
  isLoading: boolean;

  // Actions
  loadTheme: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: 'dark',
  isLoading: true,

  loadTheme: async () => {
    set({ isLoading: true });
    try {
      const savedTheme = await db.getSetting('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        set({ theme: savedTheme, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      set({ isLoading: false });
    }
  },

  setTheme: async (theme) => {
    try {
      await db.setSetting('theme', theme);
      set({ theme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },

  toggleTheme: async () => {
    const { theme } = get();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await get().setTheme(newTheme);
  },
}));
