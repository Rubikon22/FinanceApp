import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Account, User, Budget, RecurringTransaction } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ---------- Auth ----------

export const supabaseSignIn = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return mapUser(data.user);
};

export const supabaseSignUp = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Brak użytkownika po rejestracji');

  // Session is null when email confirmation is required
  if (!data.session) {
    throw new Error(
      'Na adres ' + email + ' wysłano link aktywacyjny.\n\nSprawdź skrzynkę i kliknij w link, aby aktywować konto.\n\n(Możesz też wyłączyć potwierdzanie email w Supabase Dashboard → Authentication → Providers → Email)'
    );
  }

  return mapUser(data.user);
};

export const supabaseSignOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSupabaseUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ? mapUser(session.user) : null;
};

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapUser(session.user) : null);
  });
  return () => subscription.unsubscribe();
};

const mapUser = (user: any): User => ({
  id: user.id,
  email: user.email || '',
  displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
});

// ---------- Transactions ----------

export const syncTransactions = async (userId: string, transactions: Transaction[]): Promise<void> => {
  const rows = transactions.map(t => ({
    id: t.id,
    user_id: userId,
    type: t.type,
    amount: t.amount,
    category_id: t.categoryId,
    account_id: t.accountId,
    to_account_id: t.toAccountId ?? null,
    note: t.note ?? null,
    date: t.date,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    synced: true,
  }));

  const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
};

export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  return (data ?? []).map(row => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    accountId: row.account_id,
    toAccountId: row.to_account_id ?? undefined,
    note: row.note ?? undefined,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: true,
  }));
};

export const deleteTransactionFromCloud = async (transactionId: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
  if (error) throw error;
};

// ---------- Accounts ----------

export const syncAccounts = async (userId: string, accounts: Account[]): Promise<void> => {
  const rows = accounts.map(a => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    balance: a.balance,
    icon: a.icon,
    color: a.color,
    created_at: a.createdAt,
  }));

  const { error } = await supabase.from('accounts').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
};

export const fetchAccounts = async (userId: string): Promise<Account[]> => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    balance: row.balance,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
  }));
};

export const deleteAccountFromCloud = async (accountId: string): Promise<void> => {
  const { error } = await supabase.from('accounts').delete().eq('id', accountId);
  if (error) throw error;
};

// ---------- Budgets ----------

export const syncBudgets = async (userId: string, budgets: Budget[]): Promise<void> => {
  const rows = budgets.map(b => ({
    id: b.id,
    user_id: userId,
    category_id: b.categoryId,
    amount: b.amount,
    period: b.period,
    created_at: b.createdAt,
  }));
  const { error } = await supabase.from('budgets').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
};

export const fetchBudgets = async (userId: string): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    period: row.period,
    createdAt: row.created_at,
  }));
};

export const deleteBudgetFromCloud = async (budgetId: string): Promise<void> => {
  const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
  if (error) throw error;
};

// ---------- Recurring Transactions ----------

export const syncRecurringTransactions = async (userId: string, recurring: RecurringTransaction[]): Promise<void> => {
  const rows = recurring.map(r => ({
    id: r.id,
    user_id: userId,
    type: r.type,
    amount: r.amount,
    category_id: r.categoryId,
    account_id: r.accountId,
    to_account_id: r.toAccountId ?? null,
    note: r.note ?? null,
    frequency: r.frequency,
    next_occurrence: r.nextOccurrence,
    last_processed: r.lastProcessed ?? null,
    is_active: r.isActive,
    created_at: r.createdAt,
  }));
  const { error } = await supabase.from('recurring_transactions').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
};

export const fetchRecurringTransactions = async (userId: string): Promise<RecurringTransaction[]> => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    accountId: row.account_id,
    toAccountId: row.to_account_id ?? undefined,
    note: row.note ?? undefined,
    frequency: row.frequency,
    nextOccurrence: row.next_occurrence,
    lastProcessed: row.last_processed ?? undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  }));
};
