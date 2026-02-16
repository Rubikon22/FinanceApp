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
import { Colors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { Budget } from '@/types';
import { EXPENSE_CATEGORIES } from '@/constants/categories';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (categoryId: string, amount: number, period: 'month' | 'year') => Promise<void>;
  existingBudgets: Budget[];
  editingBudget?: Budget | null;
}

export const BudgetForm: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  existingBudgets,
  editingBudget,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [isSaving, setIsSaving] = useState(false);

  // Filter out categories that already have budgets
  const availableCategories = EXPENSE_CATEGORIES.filter(
    cat => !existingBudgets.some(b => b.categoryId === cat.id) || editingBudget?.categoryId === cat.id
  );

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAmount(editingBudget.amount.toString());
      setPeriod(editingBudget.period);
    } else {
      resetForm();
    }
  }, [editingBudget, visible]);

  const resetForm = () => {
    setCategoryId('');
    setAmount('');
    setPeriod('month');
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!categoryId) return;

    setIsSaving(true);
    try {
      await onSave(categoryId, parseFloat(amount), period);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
              {editingBudget ? pl.budgets.edit : pl.budgets.add}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.budgets.selectCategory}</Text>
              <View style={styles.categoriesGrid}>
                {availableCategories.map(cat => (
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
                      color={categoryId === cat.id ? Colors.white : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        categoryId === cat.id && { color: Colors.white },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.budgets.limit}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Period */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.budgets.period}</Text>
              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
                  onPress={() => setPeriod('month')}
                >
                  <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
                    {pl.budgets.monthly}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
                  onPress={() => setPeriod('year')}
                >
                  <Text style={[styles.periodText, period === 'year' && styles.periodTextActive]}>
                    {pl.budgets.yearly}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving || !amount || !categoryId}
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '80%',
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
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
