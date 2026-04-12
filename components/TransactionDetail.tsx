import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { getThemeColors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { useAccounts } from '@/store/useAccounts';
import { useTransactions } from '@/store/useTransactions';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';
import { format } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';

interface TransactionDetailProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transaction,
  visible,
  onClose,
  onEdit,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const getAccountById = useAccounts(state => state.getAccountById);
  const deleteTransaction = useTransactions(state => state.deleteTransaction);
  const loadAccounts = useAccounts(state => state.loadAccounts);

  if (!transaction) return null;

  const category = getCategoryById(transaction.categoryId);
  const account = getAccountById(transaction.accountId);
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

  const getTypeLabel = () => {
    switch (transaction.type) {
      case 'income':
        return pl.transaction.income;
      case 'expense':
        return pl.transaction.expense;
      case 'transfer':
        return pl.transaction.transfer;
    }
  };

  const getTypeColor = () => {
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

  const handleDelete = () => {
    Alert.alert(
      'Usun transakcje',
      'Czy na pewno chcesz usunac te transakcje?',
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              await loadAccounts();
              onClose();
            } catch (error) {
              Alert.alert(pl.errors.errorTitle, pl.errors.deleteTransactionFailed);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Szczegoly</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: getTypeColor() }]}>
              {getAmountPrefix()}{transaction.amount.toFixed(2)} {pl.common.currency}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
              <Text style={styles.typeText}>{getTypeLabel()}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Category */}
            {transaction.type !== 'transfer' && category && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={20} color={colors.white} />
                  </View>
                  <Text style={styles.detailLabel}>Kategoria</Text>
                </View>
                <Text style={styles.detailValue}>{category.name}</Text>
              </View>
            )}

            {/* Account */}
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={[styles.iconContainer, { backgroundColor: account?.color || colors.gray }]}>
                  <Ionicons name={(account?.icon || 'wallet') as any} size={20} color={colors.white} />
                </View>
                <Text style={styles.detailLabel}>
                  {transaction.type === 'transfer' ? 'Z konta' : 'Konto'}
                </Text>
              </View>
              <Text style={styles.detailValue}>{account?.name || '-'}</Text>
            </View>

            {/* To Account (for transfer) */}
            {transaction.type === 'transfer' && toAccount && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: toAccount.color }]}>
                    <Ionicons name={toAccount.icon as any} size={20} color={colors.white} />
                  </View>
                  <Text style={styles.detailLabel}>Na konto</Text>
                </View>
                <Text style={styles.detailValue}>{toAccount.name}</Text>
              </View>
            )}

            {/* Date */}
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="calendar" size={20} color={colors.white} />
                </View>
                <Text style={styles.detailLabel}>Data</Text>
              </View>
              <View style={styles.detailRight}>
                <Text style={styles.detailValue}>
                  {format(new Date(transaction.date), 'dd.MM.yyyy')}
                </Text>
                <Text style={styles.detailSubvalue}>
                  {format(new Date(transaction.date), 'EEEE', { locale: dateFnsPl })}
                </Text>
              </View>
            </View>

            {/* Note */}
            {transaction.note && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Notatka</Text>
                <Text style={styles.noteText}>{transaction.note}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>Edytuj</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>Usun</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  detailsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  detailSubvalue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  noteContainer: {
    paddingTop: 12,
  },
  noteLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.expense,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
