import React, { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { pl } from '@/i18n/pl';
import { Category, Account } from '@/types';
import { getCategoryById } from '@/constants/categories';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { TransactionForm, TransactionFormData, TransactionFormInitialValues } from '@/components/TransactionForm';

export default function EditTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const transactions = useTransactions(state => state.transactions);
  const updateTransaction = useTransactions(state => state.updateTransaction);
  const accounts = useAccounts(state => state.accounts);
  const loadAccounts = useAccounts(state => state.loadAccounts);
  const getAccountById = useAccounts(state => state.getAccountById);

  const [isSaving, setIsSaving] = useState(false);

  const transactionId = params.id as string | undefined;
  const transaction = useMemo(
    () => transactions.find(t => t.id === transactionId),
    [transactions, transactionId]
  );

  const initialValues = useMemo<TransactionFormInitialValues | undefined>(() => {
    if (!transaction) return undefined;

    let category: Category | null = null;
    if (transaction.type !== 'transfer') {
      category = getCategoryById(transaction.categoryId) || null;
    }

    const account: Account | null = getAccountById(transaction.accountId) || null;
    const toAccount: Account | null = transaction.toAccountId
      ? getAccountById(transaction.toAccountId) || null
      : null;

    return {
      type: transaction.type as 'expense' | 'income' | 'transfer',
      amount: transaction.amount.toString(),
      category,
      account,
      toAccount,
      note: transaction.note || '',
      date: new Date(transaction.date),
    };
  }, [transaction]);

  const handleSave = async (data: TransactionFormData) => {
    if (!transaction) {
      Alert.alert(pl.errors.errorTitle, pl.errors.transactionNotFound);
      return;
    }

    setIsSaving(true);
    try {
      await updateTransaction({
        ...transaction,
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        note: data.note,
        date: data.date,
      });
      await loadAccounts();
      router.back();
    } catch (error) {
      Alert.alert(pl.errors.errorTitle, pl.errors.updateTransactionFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction || !initialValues) {
    return null;
  }

  return (
    <TransactionForm
      title={pl.add.editTitle}
      saveButtonText={pl.add.saveChanges}
      accounts={accounts}
      initialValues={initialValues}
      isSaving={isSaving}
      onSave={handleSave}
    />
  );
}
