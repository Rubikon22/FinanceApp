import { create } from 'zustand';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AUTH_KEY = '@finance_app_auth';

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Firebase auth will be implemented here
      // For now, just simulate login
      const user: User = {
        id: 'local-user',
        email,
        displayName: email.split('@')[0],
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to logout';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem(AUTH_KEY);
      if (userData) {
        const user = JSON.parse(userData) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
