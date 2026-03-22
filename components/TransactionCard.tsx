import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { Colors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { useAccounts } from '@/store/useAccounts';
import { useTransactions } from '@/store/useTransactions';
import { pl } from '@/i18n/pl';
import { format } from 'date-fns';

interface Props {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<Props> = ({ transaction, visible, onClose, onEdit }) => {
  const getAccountById = useAccounts(s => s.getAccountById);
  const deleteTransaction = useTransactions(s => s.deleteTransaction);
  const loadAccounts = useAccounts(s => s.loadAccounts);

  if (!transaction) return null;

  const category = getCategoryById(transaction.categoryId);
  const account = getAccountById(transaction.accountId);
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

  const typeColor =
    transaction.type === 'income' ? Colors.income :
    transaction.type === 'expense' ? Colors.expense :
    Colors.transfer;

  const amountPrefix =
    transaction.type === 'income' ? '+' :
    transaction.type === 'expense' ? '-' : '';

  const typeLabel =
    transaction.type === 'income' ? pl.transaction.income :
    transaction.type === 'expense' ? pl.transaction.expense :
    pl.transaction.transfer;

  const handleDelete = () => {
    Alert.alert('Usun transakcje', 'Czy na pewno chcesz usunac te transakcje?', [
      { text: pl.common.cancel, style: 'cancel' },
      {
        text: pl.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(transaction.id);
            await loadAccounts();
            onClose();
          } catch {
            Alert.alert(pl.errors.errorTitle, pl.errors.deleteTransactionFailed);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.card}>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.amount, { color: typeColor }]}>
            {amountPrefix}{transaction.amount.toFixed(2)} {pl.common.currency}
          </Text>

          <View style={[styles.badge, { backgroundColor: typeColor + '25' }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>

          <View style={styles.infoBlock}>
            {transaction.type !== 'transfer' && category && (
              <View style={styles.row}>
                <Text style={styles.label}>Kategoria</Text>
                <Text style={styles.value}>{category.name}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>{transaction.type === 'transfer' ? 'Z konta' : 'Konto'}</Text>
              <Text style={styles.value}>{account?.name || '-'}</Text>
            </View>
            {transaction.type === 'transfer' && toAccount && (
              <View style={styles.row}>
                <Text style={styles.label}>Na konto</Text>
                <Text style={styles.value}>{toAccount.name}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Data</Text>
              <Text style={styles.value}>{format(new Date(transaction.date), 'dd.MM.yyyy')}</Text>
            </View>
            {!!transaction.note && (
              <View style={styles.row}>
                <Text style={styles.label}>Notatka</Text>
                <Text style={[styles.value, { fontStyle: 'italic', fontWeight: '400' }]} numberOfLines={2}>
                  {transaction.note}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={styles.btnText}>Edytuj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.expense }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.btnText}>Usun</Text>
            </TouchableOpacity>
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  amount: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
