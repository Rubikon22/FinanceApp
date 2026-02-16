export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export type PeriodType = 'week' | 'month' | 'year';

export interface ChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Recurring transactions
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note?: string;
  frequency: RecurringFrequency;
  nextOccurrence: string;
  lastProcessed?: string;
  isActive: boolean;
  createdAt: string;
}

// Budgets
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'month' | 'year';
  createdAt: string;
}

// Theme
export type ThemeMode = 'light' | 'dark';
