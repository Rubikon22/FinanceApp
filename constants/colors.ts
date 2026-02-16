import { ThemeMode } from '@/types';

const DarkTheme = {
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  background: '#1A1A2E',
  surface: '#16213E',
  card: '#0F3460',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2D2D44',

  income: '#00D9A5',
  expense: '#FF6B6B',
  transfer: '#4ECDC4',

  categories: {
    food: '#FF6B6B',
    transport: '#4ECDC4',
    shopping: '#FFE66D',
    entertainment: '#A29BFE',
    health: '#FF8ED4',
    bills: '#45B7D1',
    education: '#96CEB4',
    other: '#95A5A6',
    salary: '#00D9A5',
    gift: '#FFB8B8',
    investment: '#74B9FF',
  },

  white: '#FFFFFF',
  black: '#000000',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  darkGray: '#343A40',

  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  info: '#17A2B8',
};

const LightTheme = {
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#F0F0F5',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  border: '#E0E0E5',

  income: '#00B894',
  expense: '#E74C3C',
  transfer: '#00CEC9',

  categories: {
    food: '#E74C3C',
    transport: '#00CEC9',
    shopping: '#F39C12',
    entertainment: '#9B59B6',
    health: '#E84393',
    bills: '#3498DB',
    education: '#27AE60',
    other: '#7F8C8D',
    salary: '#00B894',
    gift: '#FD79A8',
    investment: '#74B9FF',
  },

  white: '#FFFFFF',
  black: '#000000',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  darkGray: '#343A40',

  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  info: '#17A2B8',
};

export const getThemeColors = (theme: ThemeMode) => {
  return theme === 'dark' ? DarkTheme : LightTheme;
};

// Default export for backwards compatibility - will be replaced by dynamic theme
export const Colors = DarkTheme;

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
