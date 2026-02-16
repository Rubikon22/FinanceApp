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
import { TransactionType } from '@/types';
import { ALL_CATEGORIES } from '@/constants/categories';

export interface SearchFilters {
  query: string;
  type: TransactionType | 'all';
  categoryId: string | null;
  minAmount: number | null;
  maxAmount: number | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
}

export const SearchFilterModal: React.FC<Props> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      type: 'all',
      categoryId: null,
      minAmount: null,
      maxAmount: null,
    };
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  const types: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: pl.common.all },
    { value: 'expense', label: pl.transaction.expense },
    { value: 'income', label: pl.transaction.income },
    { value: 'transfer', label: pl.transaction.transfer },
  ];

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
            <Text style={styles.modalTitle}>{pl.search.filters}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Search query */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.common.search}</Text>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={localFilters.query}
                  onChangeText={(query) => setLocalFilters({ ...localFilters, query })}
                  placeholder={pl.search.placeholder}
                  placeholderTextColor={Colors.textSecondary}
                />
                {localFilters.query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setLocalFilters({ ...localFilters, query: '' })}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.search.type}</Text>
              <View style={styles.typeContainer}>
                {types.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeButton,
                      localFilters.type === t.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, type: t.value })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        localFilters.type === t.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.search.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !localFilters.categoryId && styles.categoryChipActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, categoryId: null })}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      !localFilters.categoryId && styles.categoryChipTextActive,
                    ]}
                  >
                    {pl.common.all}
                  </Text>
                </TouchableOpacity>
                {ALL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      localFilters.categoryId === cat.id && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, categoryId: cat.id })}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={localFilters.categoryId === cat.id ? Colors.white : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        localFilters.categoryId === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Amount range */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.search.amountRange}</Text>
              <View style={styles.amountRow}>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountLabel}>{pl.search.minAmount}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={localFilters.minAmount?.toString() || ''}
                    onChangeText={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        minAmount: value ? parseFloat(value) : null,
                      })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                <Text style={styles.amountDivider}>-</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountLabel}>{pl.search.maxAmount}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={localFilters.maxAmount?.toString() || ''}
                    onChangeText={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        maxAmount: value ? parseFloat(value) : null,
                      })
                    }
                    keyboardType="decimal-pad"
                    placeholder="9999"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>{pl.search.clearFilters}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>{pl.common.confirm}</Text>
              </TouchableOpacity>
            </View>
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
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 20,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  amountInputContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amountInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  amountDivider: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
