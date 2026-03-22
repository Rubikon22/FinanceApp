import { create } from 'zustand';
import { User } from '@/types';
import { supabaseSignIn, supabaseSignUp, supabaseSignOut, getSupabaseUser } from '@/services/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

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
      const user = await supabaseSignIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Błąd logowania';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await supabaseSignUp(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Błąd rejestracji';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabaseSignOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Błąd wylogowania';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await getSupabaseUser();
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
