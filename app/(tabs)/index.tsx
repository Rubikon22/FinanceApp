import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { Transaction } from '@/types';
import { useTransactions } from '@/store/useTransactions';
import { useTheme } from '@/store/useTheme';
import { TransactionList } from '@/components/TransactionList';
import { SmartInsights } from '@/components/SmartInsights';
import { generateSmartInsights } from '@/services/aiInsights';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';

export default function RecordsScreen() {
  const router = useRouter();
  // Calendar & Filters are now separate screens
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localMinAmount, setLocalMinAmount] = useState('');
  const [localMaxAmount, setLocalMaxAmount] = useState('');

  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const transactions = useTransactions(state => state.transactions);
  const isLoading = useTransactions(state => state.isLoading);
  const loadTransactions = useTransactions(state => state.loadTransactions);
  const selectedDate = useTransactions(state => state.selectedDate);
  const setSelectedDate = useTransactions(state => state.setSelectedDate);
  const getFilteredTransactions = useTransactions(state => state.getFilteredTransactions);
  const advancedFilters = useTransactions(state => state.advancedFilters);
  const setAdvancedFilters = useTransactions(state => state.setAdvancedFilters);
  const getAdvancedFilteredTransactions = useTransactions(state => state.getAdvancedFilteredTransactions);

  // Use advanced filters if any are active, otherwise use simple date filter
  const hasAdvancedFilters = advancedFilters.query || advancedFilters.type !== 'all' ||
    advancedFilters.categoryId || advancedFilters.minAmount !== null || advancedFilters.maxAmount !== null;

  const filteredTransactions = hasAdvancedFilters
    ? getAdvancedFilteredTransactions()
    : getFilteredTransactions();

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const monthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions, currentMonth]);

  const handleRefresh = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      query: '',
      type: 'all',
      categoryId: null,
      minAmount: null,
      maxAmount: null,
    });
    setLocalSearchQuery('');
    setLocalMinAmount('');
    setLocalMaxAmount('');
  };

  const handleMinAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(',', '.');
    setLocalMinAmount(cleaned);
    const value = parseFloat(cleaned);
    setAdvancedFilters({ ...advancedFilters, minAmount: isNaN(value) || cleaned === '' ? null : value });
  }, [advancedFilters, setAdvancedFilters]);

  const handleMaxAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(',', '.');
    setLocalMaxAmount(cleaned);
    const value = parseFloat(cleaned);
    setAdvancedFilters({ ...advancedFilters, maxAmount: isNaN(value) || cleaned === '' ? null : value });
  }, [advancedFilters, setAdvancedFilters]);

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push(`/edit-transaction?id=${transaction.id}`);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>{pl.main.title}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/calendar')}
          >
            <Ionicons name="calendar" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar (quick search) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={localSearchQuery}
            onChangeText={(text) => {
              setLocalSearchQuery(text);
              setAdvancedFilters({ ...advancedFilters, query: text });
            }}
            placeholder={pl.search.placeholder}
            placeholderTextColor={colors.textSecondary}
          />
          {localSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setLocalSearchQuery('');
              setAdvancedFilters({ ...advancedFilters, query: '' });
            }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasAdvancedFilters && styles.filterButtonActive]}
          onPress={() => router.push('/filters')}
        >
          <Ionicons
            name="options"
            size={22}
            color={hasAdvancedFilters ? colors.white : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Amount Filter Row */}
      <View style={styles.amountFilterRow}>
        <View style={[styles.amountFilterInput, { backgroundColor: colors.surface }]}>
          <Ionicons name="trending-up" size={14} color={colors.income} />
          <TextInput
            style={[styles.amountFilterText, { color: colors.text }]}
            value={localMinAmount}
            onChangeText={handleMinAmountChange}
            placeholder="Min zł"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />
          {localMinAmount.length > 0 && (
            <TouchableOpacity onPress={() => handleMinAmountChange('')}>
              <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.amountFilterInput, { backgroundColor: colors.surface }]}>
          <Ionicons name="trending-down" size={14} color={colors.expense} />
          <TextInput
            style={[styles.amountFilterText, { color: colors.text }]}
            value={localMaxAmount}
            onChangeText={handleMaxAmountChange}
            placeholder="Max zł"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />
          {localMaxAmount.length > 0 && (
            <TouchableOpacity onPress={() => handleMaxAmountChange('')}>
              <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.amountFilterPresets}>
          {[50, 100, 500].map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.presetChip, { backgroundColor: colors.surface }]}
              onPress={() => handleMaxAmountChange(String(val))}
            >
              <Text style={[styles.presetChipText, { color: colors.textSecondary }]}>&lt;{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Month Summary Card */}
      <View style={styles.summaryCard}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(currentMonth, 'LLLL yyyy', { locale: dateFnsPl })}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Przychody</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              +{monthlyStats.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Wydatki</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              -{monthlyStats.expenses.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bilans</Text>
            <Text style={[
              styles.statValue,
              { color: monthlyStats.balance >= 0 ? colors.income : colors.expense }
            ]}>
              {monthlyStats.balance >= 0 ? '+' : ''}{monthlyStats.balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Badges */}
      {(selectedDate || hasAdvancedFilters) && (
        <View style={styles.filterBadgeContainer}>
          {selectedDate && (
            <View style={styles.filterBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.white} />
              <Text style={styles.filterBadgeText}>
                {format(selectedDate, 'dd.MM.yyyy')}
              </Text>
              <TouchableOpacity onPress={clearDateFilter}>
                <Ionicons name="close-circle" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
          {advancedFilters.type !== 'all' && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {advancedFilters.type === 'expense' ? pl.transaction.expense :
                 advancedFilters.type === 'income' ? pl.transaction.income : pl.transaction.transfer}
              </Text>
            </View>
          )}
          {advancedFilters.categoryId && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {advancedFilters.categoryId}
              </Text>
            </View>
          )}
          {(advancedFilters.minAmount !== null || advancedFilters.maxAmount !== null) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {advancedFilters.minAmount ?? 0} - {advancedFilters.maxAmount ?? '∞'}
              </Text>
            </View>
          )}
          {hasAdvancedFilters && (
            <TouchableOpacity onPress={clearAdvancedFilters} style={styles.clearAllBadge}>
              <Ionicons name="close" size={14} color={colors.expense} />
              <Text style={[styles.filterBadgeText, { color: colors.expense }]}>
                {pl.search.clearFilters}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Smart Insights */}
      {!hasAdvancedFilters && !selectedDate && (
        <SmartInsights
          insights={generateSmartInsights(transactions)}
          theme={theme}
        />
      )}

      {/* Transaction List */}
      <TransactionList
        transactions={filteredTransactions}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        onTransactionPress={handleTransactionPress}
        onEditTransaction={handleTransactionPress}
      />

    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    width: 40,
    justifyContent: 'flex-end',
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  amountFilterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
    flex: 1,
  },
  amountFilterText: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  amountFilterPresets: {
    flexDirection: 'row',
    gap: 4,
  },
  presetChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  clearAllBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.expense}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 13,
  },
});
