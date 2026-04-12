import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { useAccounts } from '@/store/useAccounts';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'lastProcessed'>) => Promise<void>;
  editingRecurring?: RecurringTransaction | null;
}

const frequencies: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: pl.recurring.daily },
  { value: 'weekly', label: pl.recurring.weekly },
  { value: 'monthly', label: pl.recurring.monthly },
  { value: 'yearly', label: pl.recurring.yearly },
];

export const RecurringTransactionForm: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  editingRecurring,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const accounts = useAccounts(state => state.accounts);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (editingRecurring) {
      setType(editingRecurring.type);
      setAmount(editingRecurring.amount.toString());
      setCategoryId(editingRecurring.categoryId);
      setAccountId(editingRecurring.accountId);
      setNote(editingRecurring.note || '');
      setFrequency(editingRecurring.frequency);
      setIsActive(editingRecurring.isActive);
    } else {
      resetForm();
    }
  }, [editingRecurring, visible]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategoryId('');
    setNote('');
    setFrequency('monthly');
    setIsActive(true);
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  };

  const calculateNextOccurrence = (): string => {
    const today = new Date();
    let nextDate: Date;

    switch (frequency) {
      case 'daily':
        nextDate = addDays(today, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(today, 1);
        break;
      case 'monthly':
        nextDate = addMonths(today, 1);
        break;
      case 'yearly':
        nextDate = addYears(today, 1);
        break;
      default:
        nextDate = addMonths(today, 1);
    }

    return format(nextDate, 'yyyy-MM-dd');
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!categoryId) return;
    if (!accountId) return;

    setIsSaving(true);
    try {
      await onSave({
        type,
        amount: parseFloat(amount),
        categoryId,
        accountId,
        note: note.trim() || undefined,
        frequency,
        nextOccurrence: editingRecurring?.nextOccurrence || calculateNextOccurrence(),
        isActive,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save recurring transaction:', error);
    } finally {
      setIsSaving(false);
    }
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingRecurring ? pl.recurring.edit : pl.recurring.add}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => { setType('expense'); setCategoryId(''); }}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  {pl.transaction.expense}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
                onPress={() => { setType('income'); setCategoryId(''); }}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  {pl.transaction.income}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.add.amount}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.add.category}</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      categoryId === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={24}
                      color={categoryId === cat.id ? colors.white : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        categoryId === cat.id && { color: colors.white },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Account */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.add.account}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {accounts.map(acc => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountItem,
                      accountId === acc.id && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => setAccountId(acc.id)}
                  >
                    <View style={[styles.accountIcon, { backgroundColor: acc.color }]}>
                      <Ionicons name={acc.icon as any} size={20} color={colors.white} />
                    </View>
                    <Text style={styles.accountName}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Frequency */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.recurring.frequency}</Text>
              <View style={styles.frequencyContainer}>
                {frequencies.map(freq => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyItem,
                      frequency === freq.value && styles.frequencyItemActive,
                    ]}
                    onPress={() => setFrequency(freq.value)}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        frequency === freq.value && styles.frequencyTextActive,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.add.note}</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder={pl.add.notePlaceholder}
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            {/* Active toggle */}
            <TouchableOpacity
              style={styles.activeToggle}
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={styles.label}>
                {isActive ? pl.recurring.active : pl.recurring.inactive}
              </Text>
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={isActive ? colors.income : colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving || !amount || !categoryId || !accountId}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? pl.common.saving : pl.common.save}
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeButtonActive: {
    backgroundColor: colors.expense,
  },
  typeButtonActiveIncome: {
    backgroundColor: colors.income,
  },
  typeButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  categoryText: {
    fontSize: 10,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  accountItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 12,
    color: colors.text,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 20,
  },
  frequencyItemActive: {
    backgroundColor: colors.primary,
  },
  frequencyText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  frequencyTextActive: {
    color: colors.white,
  },
  activeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
