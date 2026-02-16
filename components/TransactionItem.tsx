import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { Colors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { useAccounts } from '@/store/useAccounts';
import { pl } from '@/i18n/pl';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const getAccountById = useAccounts(state => state.getAccountById);
  const category = getCategoryById(transaction.categoryId);
  const account = getAccountById(transaction.accountId);
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return Colors.income;
      case 'expense':
        return Colors.expense;
      case 'transfer':
        return Colors.transfer;
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      case 'transfer':
        return '';
    }
  };

  const getIcon = () => {
    if (transaction.type === 'transfer') {
      return 'swap-horizontal';
    }
    return category?.icon || 'ellipsis-horizontal';
  };

  const getSubtitle = () => {
    if (transaction.type === 'transfer' && toAccount) {
      return `${account?.name || ''} → ${toAccount.name}`;
    }
    return account?.name || '';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: category?.color || Colors.transfer }]}>
        <Ionicons
          name={getIcon() as any}
          size={22}
          color={Colors.white}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>
          {transaction.type === 'transfer' ? pl.transaction.transfer : category?.name || ''}
        </Text>
        <Text style={styles.account}>{getSubtitle()}</Text>
        {transaction.note && (
          <Text style={styles.note} numberOfLines={1}>
            {transaction.note}
          </Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: getAmountColor() }]}>
          {getAmountPrefix()}{transaction.amount.toFixed(2)} {pl.common.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  account: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
