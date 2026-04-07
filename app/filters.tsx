import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { useTransactions } from '@/store/useTransactions';
import { pl } from '@/i18n/pl';
import { TransactionType } from '@/types';
import { ALL_CATEGORIES } from '@/constants/categories';

export default function FiltersScreen() {
  const router = useRouter();
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const advancedFilters = useTransactions(state => state.advancedFilters);
  const setAdvancedFilters = useTransactions(state => state.setAdvancedFilters);

  const [localFilters, setLocalFilters] = useState(advancedFilters);

  const handleApply = () => {
    setAdvancedFilters(localFilters);
    router.back();
  };

  const handleClear = () => {
    const cleared = {
      query: '',
      type: 'all' as TransactionType | 'all',
      categoryId: null,
      minAmount: null,
      maxAmount: null,
    };
    setLocalFilters(cleared);
    setAdvancedFilters(cleared);
    router.back();
  };

  const types: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: pl.common.all },
    { value: 'expense', label: pl.transaction.expense },
    { value: 'income', label: pl.transaction.income },
    { value: 'transfer', label: pl.transaction.transfer },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{pl.search.filters}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Search query */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{pl.common.search}</Text>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={localFilters.query}
              onChangeText={(query) => setLocalFilters({ ...localFilters, query })}
              placeholder={pl.search.placeholder}
              placeholderTextColor={colors.textSecondary}
            />
            {localFilters.query.length > 0 && (
              <TouchableOpacity onPress={() => setLocalFilters({ ...localFilters, query: '' })}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{pl.search.type}</Text>
          <View style={styles.typeContainer}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.card },
                  localFilters.type === t.value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setLocalFilters({ ...localFilters, type: t.value })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    localFilters.type === t.value && { color: colors.white },
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
          <Text style={[styles.label, { color: colors.textSecondary }]}>{pl.search.category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { backgroundColor: colors.card },
                !localFilters.categoryId && { backgroundColor: colors.primary },
              ]}
              onPress={() => setLocalFilters({ ...localFilters, categoryId: null })}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: colors.textSecondary },
                  !localFilters.categoryId && { color: colors.white },
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
                  { backgroundColor: colors.card },
                  localFilters.categoryId === cat.id && { backgroundColor: cat.color },
                ]}
                onPress={() => setLocalFilters({ ...localFilters, categoryId: cat.id })}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={localFilters.categoryId === cat.id ? colors.white : cat.color}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.textSecondary },
                    localFilters.categoryId === cat.id && { color: colors.white },
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
          <Text style={[styles.label, { color: colors.textSecondary }]}>{pl.search.amountRange}</Text>
          <View style={styles.amountRow}>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>{pl.search.minAmount}</Text>
              <TextInput
                style={[styles.amountInput, { backgroundColor: colors.card, color: colors.text }]}
                value={localFilters.minAmount?.toString() || ''}
                onChangeText={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    minAmount: value ? parseFloat(value.replace(',', '.')) : null,
                  })
                }
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <Text style={[styles.amountDivider, { color: colors.textSecondary }]}>-</Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>{pl.search.maxAmount}</Text>
              <TextInput
                style={[styles.amountInput, { backgroundColor: colors.card, color: colors.text }]}
                value={localFilters.maxAmount?.toString() || ''}
                onChangeText={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    maxAmount: value ? parseFloat(value.replace(',', '.')) : null,
                  })
                }
                keyboardType="decimal-pad"
                placeholder="9999"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.clearButton, { backgroundColor: colors.card }]} onPress={handleClear}>
            <Text style={[styles.clearButtonText, { color: colors.text }]}>{pl.search.clearFilters}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={handleApply}>
            <Text style={styles.applyButtonText}>{pl.common.confirm}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  typeButtonText: {
    fontWeight: '500',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
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
    marginBottom: 4,
  },
  amountInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  amountDivider: {
    fontSize: 20,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
