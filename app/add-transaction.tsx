import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { pl } from '@/i18n/pl';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { TransactionForm, TransactionFormData } from '@/components/TransactionForm';

export default function AddTransactionScreen() {
  const router = useRouter();
  const addTransaction = useTransactions(state => state.addTransaction);
  const accounts = useAccounts(state => state.accounts);
  const loadAccounts = useAccounts(state => state.loadAccounts);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: TransactionFormData) => {
    setIsSaving(true);
    try {
      await addTransaction({
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        note: data.note,
        date: data.date,
        receiptUri: data.receiptUri,
      });
      await loadAccounts();
      router.back();
    } catch (error) {
      Alert.alert(pl.errors.errorTitle, pl.errors.addTransactionFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TransactionForm
      title={pl.add.title}
      saveButtonText={pl.add.save}
      accounts={accounts}
      isSaving={isSaving}
      onSave={handleSave}
    />
  );
}
