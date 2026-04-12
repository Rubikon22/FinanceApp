import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, Account } from '@/types';
import { getCategoryById } from '@/constants/categories';
import { format } from 'date-fns';

export interface ExportData {
  transactions: Transaction[];
  accounts: Account[];
  exportDate: string;
  version: string;
}

// Export to JSON
export const exportToJSON = async (
  transactions: Transaction[],
  accounts: Account[]
): Promise<string> => {
  const exportData: ExportData = {
    transactions,
    accounts,
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const fileName = `finanse_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
};

// Export to CSV
export const exportToCSV = async (
  transactions: Transaction[],
  accounts: Account[]
): Promise<string> => {
  // Transactions CSV
  const transactionHeaders = [
    'ID',
    'Typ',
    'Kwota',
    'Kategoria',
    'Konto',
    'Konto docelowe',
    'Notatka',
    'Data',
    'Utworzono',
  ].join(';');

  const transactionRows = transactions.map(t => {
    const category = getCategoryById(t.categoryId);
    const account = accounts.find(a => a.id === t.accountId);
    const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;

    return [
      t.id,
      t.type === 'expense' ? 'Wydatek' : t.type === 'income' ? 'Przychod' : 'Przelew',
      t.amount.toFixed(2),
      category?.name || t.categoryId,
      account?.name || t.accountId,
      toAccount?.name || '',
      `"${(t.note || '').replace(/"/g, '""')}"`,
      format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
      format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
    ].join(';');
  });

  const csvContent = [transactionHeaders, ...transactionRows].join('\n');
  const fileName = `finanse_transakcje_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  // Add BOM for proper Excel UTF-8 support
  const bom = '\uFEFF';
  await FileSystem.writeAsStringAsync(filePath, bom + csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
};

// Share exported file
export const shareFile = async (filePath: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Udostepnianie plikow nie jest dostepne na tym urzadzeniu');
  }
  await Sharing.shareAsync(filePath);
};
