import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { getThemeColors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { useAccounts } from '@/store/useAccounts';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const getAccountById = useAccounts(state => state.getAccountById);
  const category = getCategoryById(transaction.categoryId);
  const account = getAccountById(transaction.accountId);
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return colors.income;
      case 'expense':
        return colors.expense;
      case 'transfer':
        return colors.transfer;
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

  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.transfer }]}>
        <Ionicons
          name={getIcon() as any}
          size={22}
          color={colors.white}
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

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
    },
    account: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    note: {
      fontSize: 12,
      color: colors.textSecondary,
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
