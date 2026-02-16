import { Category } from '@/types';
import { Colors } from './colors';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Jedzenie', icon: 'fast-food', color: Colors.categories.food, type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'car', color: Colors.categories.transport, type: 'expense' },
  { id: 'shopping', name: 'Zakupy', icon: 'cart', color: Colors.categories.shopping, type: 'expense' },
  { id: 'entertainment', name: 'Rozrywka', icon: 'game-controller', color: Colors.categories.entertainment, type: 'expense' },
  { id: 'health', name: 'Zdrowie', icon: 'medical', color: Colors.categories.health, type: 'expense' },
  { id: 'bills', name: 'Rachunki', icon: 'receipt', color: Colors.categories.bills, type: 'expense' },
  { id: 'education', name: 'Edukacja', icon: 'school', color: Colors.categories.education, type: 'expense' },
  { id: 'other_expense', name: 'Inne', icon: 'ellipsis-horizontal', color: Colors.categories.other, type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Wynagrodzenie', icon: 'briefcase', color: Colors.categories.salary, type: 'income' },
  { id: 'gift', name: 'Prezent', icon: 'gift', color: Colors.categories.gift, type: 'income' },
  { id: 'investment', name: 'Inwestycje', icon: 'trending-up', color: Colors.categories.investment, type: 'income' },
  { id: 'other_income', name: 'Inne', icon: 'ellipsis-horizontal', color: Colors.categories.other, type: 'income' },
];

export const ALL_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryById = (id: string): Category | undefined => {
  return ALL_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoriesByType = (type: 'expense' | 'income'): Category[] => {
  return type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
};

export const DEFAULT_ACCOUNTS = [
  { id: 'cash', name: 'Gotowka', icon: 'cash', color: Colors.income, balance: 0 },
  { id: 'card', name: 'Karta', icon: 'card', color: Colors.primary, balance: 0 },
  { id: 'savings', name: 'Oszczednosci', icon: 'wallet', color: Colors.secondary, balance: 0 },
];
