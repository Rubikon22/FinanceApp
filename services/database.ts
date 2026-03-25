import * as SQLite from 'expo-sqlite';
import { Transaction, Account, RecurringTransaction, Budget } from '@/types';
import { DEFAULT_ACCOUNTS } from '@/constants/categories';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('finance.db');
    await initDatabase();
  }
  return db;
};

const initDatabase = async () => {
  if (!db) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      toAccountId TEXT,
      note TEXT,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      toAccountId TEXT,
      note TEXT,
      frequency TEXT NOT NULL,
      nextOccurrence TEXT NOT NULL,
      lastProcessed TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations: add columns that may not exist in older DB versions
  const txColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
  const txColumnNames = txColumns.map(c => c.name);
  if (!txColumnNames.includes('receiptUri')) {
    await db.execAsync('ALTER TABLE transactions ADD COLUMN receiptUri TEXT');
  }

  const accounts = await db.getAllAsync<Account>('SELECT * FROM accounts');
  if (accounts.length === 0) {
    for (const account of DEFAULT_ACCOUNTS) {
      await db.runAsync(
        'INSERT INTO accounts (id, name, balance, icon, color, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [account.id, account.name, account.balance, account.icon, account.color, new Date().toISOString()]
      );
    }
  }
};

// Transactions
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC');
  return rows.map(row => ({
    ...row,
    synced: Boolean(row.synced),
  }));
};

export const getTransactionsByDateRange = async (startDate: string, endDate: string): Promise<Transaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
  return rows.map(row => ({
    ...row,
    synced: Boolean(row.synced),
  }));
};

export const addTransaction = async (transaction: Transaction): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO transactions (id, type, amount, categoryId, accountId, toAccountId, note, date, receiptUri, createdAt, updatedAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.type,
      transaction.amount,
      transaction.categoryId,
      transaction.accountId,
      transaction.toAccountId || null,
      transaction.note || null,
      transaction.date,
      transaction.receiptUri || null,
      transaction.createdAt,
      transaction.updatedAt,
      transaction.synced ? 1 : 0,
    ]
  );

  // Update account balance
  if (transaction.type === 'expense') {
    await database.runAsync(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [transaction.amount, transaction.accountId]
    );
  } else if (transaction.type === 'income') {
    await database.runAsync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [transaction.amount, transaction.accountId]
    );
  } else if (transaction.type === 'transfer' && transaction.toAccountId) {
    await database.runAsync(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [transaction.amount, transaction.accountId]
    );
    await database.runAsync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [transaction.amount, transaction.toAccountId]
    );
  }
};

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
  const database = await getDatabase();

  // Fetch the old transaction to reverse its balance impact
  const oldTransaction = await database.getFirstAsync<Transaction>(
    'SELECT * FROM transactions WHERE id = ?',
    [transaction.id]
  );

  if (oldTransaction) {
    // Reverse old balance impact
    if (oldTransaction.type === 'expense') {
      await database.runAsync(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [oldTransaction.amount, oldTransaction.accountId]
      );
    } else if (oldTransaction.type === 'income') {
      await database.runAsync(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [oldTransaction.amount, oldTransaction.accountId]
      );
    } else if (oldTransaction.type === 'transfer' && oldTransaction.toAccountId) {
      await database.runAsync(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [oldTransaction.amount, oldTransaction.accountId]
      );
      await database.runAsync(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [oldTransaction.amount, oldTransaction.toAccountId]
      );
    }
  }

  // Update the transaction record
  await database.runAsync(
    `UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, toAccountId = ?,
     note = ?, date = ?, receiptUri = ?, updatedAt = ?, synced = ? WHERE id = ?`,
    [
      transaction.type,
      transaction.amount,
      transaction.categoryId,
      transaction.accountId,
      transaction.toAccountId || null,
      transaction.note || null,
      transaction.date,
      transaction.receiptUri || null,
      transaction.updatedAt,
      transaction.synced ? 1 : 0,
      transaction.id,
    ]
  );

  // Apply new balance impact
  if (transaction.type === 'expense') {
    await database.runAsync(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [transaction.amount, transaction.accountId]
    );
  } else if (transaction.type === 'income') {
    await database.runAsync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [transaction.amount, transaction.accountId]
    );
  } else if (transaction.type === 'transfer' && transaction.toAccountId) {
    await database.runAsync(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [transaction.amount, transaction.accountId]
    );
    await database.runAsync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [transaction.amount, transaction.toAccountId]
    );
  }
};

export const markTransactionSynced = async (id: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE transactions SET synced = 1, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const database = await getDatabase();
  const transaction = await database.getFirstAsync<Transaction>(
    'SELECT * FROM transactions WHERE id = ?',
    [id]
  );

  if (transaction) {
    // Reverse the balance change
    if (transaction.type === 'expense') {
      await database.runAsync(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [transaction.amount, transaction.accountId]
      );
    } else if (transaction.type === 'income') {
      await database.runAsync(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [transaction.amount, transaction.accountId]
      );
    } else if (transaction.type === 'transfer' && transaction.toAccountId) {
      await database.runAsync(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [transaction.amount, transaction.accountId]
      );
      await database.runAsync(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [transaction.amount, transaction.toAccountId]
      );
    }

    await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  }
};

// Accounts
export const getAllAccounts = async (): Promise<Account[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<Account>('SELECT * FROM accounts ORDER BY createdAt ASC');
};

export const addAccount = async (account: Account): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO accounts (id, name, balance, icon, color, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [account.id, account.name, account.balance, account.icon, account.color, account.createdAt]
  );
};

export const updateAccount = async (account: Account): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE accounts SET name = ?, balance = ?, icon = ?, color = ? WHERE id = ?',
    [account.name, account.balance, account.icon, account.color, account.id]
  );
};

export const deleteAccount = async (id: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
  await database.runAsync('DELETE FROM transactions WHERE accountId = ? OR toAccountId = ?', [id, id]);
};

export const getAccountById = async (id: string): Promise<Account | null> => {
  const database = await getDatabase();
  return await database.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', [id]);
};

// Recurring Transactions
export const getAllRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<RecurringTransaction>(
    'SELECT * FROM recurring_transactions ORDER BY nextOccurrence ASC'
  );
  return rows.map(row => ({
    ...row,
    isActive: Boolean(row.isActive),
  }));
};

export const addRecurringTransaction = async (recurring: RecurringTransaction): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO recurring_transactions (id, type, amount, categoryId, accountId, toAccountId, note, frequency, nextOccurrence, lastProcessed, isActive, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recurring.id,
      recurring.type,
      recurring.amount,
      recurring.categoryId,
      recurring.accountId,
      recurring.toAccountId || null,
      recurring.note || null,
      recurring.frequency,
      recurring.nextOccurrence,
      recurring.lastProcessed || null,
      recurring.isActive ? 1 : 0,
      recurring.createdAt,
    ]
  );
};

export const updateRecurringTransaction = async (recurring: RecurringTransaction): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE recurring_transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, toAccountId = ?,
     note = ?, frequency = ?, nextOccurrence = ?, lastProcessed = ?, isActive = ? WHERE id = ?`,
    [
      recurring.type,
      recurring.amount,
      recurring.categoryId,
      recurring.accountId,
      recurring.toAccountId || null,
      recurring.note || null,
      recurring.frequency,
      recurring.nextOccurrence,
      recurring.lastProcessed || null,
      recurring.isActive ? 1 : 0,
      recurring.id,
    ]
  );
};

export const deleteRecurringTransaction = async (id: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
};

export const getDueRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  const database = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const rows = await database.getAllAsync<RecurringTransaction>(
    'SELECT * FROM recurring_transactions WHERE isActive = 1 AND nextOccurrence <= ?',
    [today]
  );
  return rows.map(row => ({
    ...row,
    isActive: Boolean(row.isActive),
  }));
};

// Budgets
export const getAllBudgets = async (): Promise<Budget[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<Budget>('SELECT * FROM budgets ORDER BY createdAt DESC');
};

export const addBudget = async (budget: Budget): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO budgets (id, categoryId, amount, period, createdAt) VALUES (?, ?, ?, ?, ?)',
    [budget.id, budget.categoryId, budget.amount, budget.period, budget.createdAt]
  );
};

export const updateBudget = async (budget: Budget): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE budgets SET amount = ?, period = ? WHERE id = ?',
    [budget.amount, budget.period, budget.id]
  );
};

export const deleteBudget = async (id: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
};

export const getBudgetByCategoryId = async (categoryId: string): Promise<Budget | null> => {
  const database = await getDatabase();
  return await database.getFirstAsync<Budget>('SELECT * FROM budgets WHERE categoryId = ?', [categoryId]);
};

// Settings
export const getSetting = async (key: string): Promise<string | null> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return result?.value || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM accounts;
    DELETE FROM recurring_transactions;
    DELETE FROM budgets;
  `);
};
