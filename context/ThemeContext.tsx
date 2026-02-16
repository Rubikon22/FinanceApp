import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '@/types';
import { useTheme } from '@/store/useTheme';
import { getThemeColors } from '@/constants/colors';

interface ThemeContextType {
  theme: ThemeMode;
  colors: ReturnType<typeof getThemeColors>;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeStore = useTheme();
  const [colors, setColors] = useState(getThemeColors(themeStore.theme));

  useEffect(() => {
    themeStore.loadTheme();
  }, []);

  useEffect(() => {
    setColors(getThemeColors(themeStore.theme));
  }, [themeStore.theme]);

  const value: ThemeContextType = {
    theme: themeStore.theme,
    colors,
    toggleTheme: themeStore.toggleTheme,
    setTheme: themeStore.setTheme,
    isLoading: themeStore.isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
