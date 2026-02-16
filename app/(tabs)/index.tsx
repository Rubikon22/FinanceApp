import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Colors, getThemeColors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { Transaction } from '@/types';
import { useTransactions } from '@/store/useTransactions';
import { useTheme } from '@/store/useTheme';
import { TransactionList } from '@/components/TransactionList';
import { TransactionDetail } from '@/components/TransactionDetail';
import { SearchFilterModal, SearchFilters } from '@/components/SearchFilter';
import { SmartInsights } from '@/components/SmartInsights';
import { generateSmartInsights } from '@/services/aiInsights';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';

export default function RecordsScreen() {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

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

  // Calculate daily stats for calendar
  const dailyStats = useMemo(() => {
    const stats: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!stats[dateKey]) {
        stats[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        stats[dateKey].income += t.amount;
      } else if (t.type === 'expense') {
        stats[dateKey].expense += t.amount;
      }
    });

    return stats;
  }, [transactions]);

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

  const handleDateSelect = (day: DateData) => {
    const date = new Date(day.dateString);
    setSelectedDate(date);
    setCurrentMonth(date);
    setShowCalendar(false);
  };

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
  };

  const handleApplyFilters = (filters: SearchFilters) => {
    setAdvancedFilters(filters);
    setLocalSearchQuery(filters.query);
  };

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
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    router.push(`/edit-transaction?id=${transaction.id}`);
  };

  // Custom day component for calendar
  const renderDay = (date: DateData, state: string | undefined) => {
    const dateKey = date.dateString;
    const stats = dailyStats[dateKey];
    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateKey;
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
    const isDisabled = state === 'disabled';

    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          isSelected && styles.daySelected,
          isToday && !isSelected && styles.dayToday,
        ]}
        onPress={() => handleDateSelect(date)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && styles.dayTextSelected,
            isToday && !isSelected && styles.dayTextToday,
            isDisabled && styles.dayTextDisabled,
          ]}
        >
          {date.day}
        </Text>
        {stats && (
          <View style={styles.dayStats}>
            {stats.income > 0 && (
              <Text style={styles.dayIncome} numberOfLines={1}>
                +{stats.income >= 1000 ? Math.floor(stats.income / 1000) + 'k' : stats.income.toFixed(0)}
              </Text>
            )}
            {stats.expense > 0 && (
              <Text style={styles.dayExpense} numberOfLines={1}>
                -{stats.expense >= 1000 ? Math.floor(stats.expense / 1000) + 'k' : stats.expense.toFixed(0)}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchFilter(true)}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{pl.main.title}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCalendar(true)}
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
          onPress={() => setShowSearchFilter(true)}
        >
          <Ionicons
            name="options"
            size={22}
            color={hasAdvancedFilters ? colors.white : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Month Summary Card */}
      <View style={styles.summaryCard}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(currentMonth, 'LLLL yyyy', { locale: dateFnsPl })}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Przychody</Text>
            <Text style={[styles.statValue, { color: Colors.income }]}>
              +{monthlyStats.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Wydatki</Text>
            <Text style={[styles.statValue, { color: Colors.expense }]}>
              -{monthlyStats.expenses.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bilans</Text>
            <Text style={[
              styles.statValue,
              { color: monthlyStats.balance >= 0 ? Colors.income : Colors.expense }
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
        onEditTransaction={handleEditTransaction}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetail
        transaction={selectedTransaction}
        visible={showTransactionDetail}
        onClose={() => setShowTransactionDetail(false)}
        onEdit={handleEditTransaction}
      />

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Wybierz date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              dayComponent={({ date, state }) => renderDay(date as DateData, state)}
              theme={{
                backgroundColor: Colors.surface,
                calendarBackground: Colors.surface,
                textSectionTitleColor: Colors.textSecondary,
                arrowColor: Colors.primary,
                monthTextColor: Colors.text,
                textMonthFontWeight: '700',
                textMonthFontSize: 18,
              }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>

      {/* Search Filter Modal */}
      <SearchFilterModal
        visible={showSearchFilter}
        onClose={() => setShowSearchFilter(false)}
        filters={advancedFilters}
        onApplyFilters={handleApplyFilters}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '95%',
    maxWidth: 420,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendar: {
    borderRadius: 12,
  },
  // Day component styles
  dayContainer: {
    width: 44,
    height: 54,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
  },
  dayTextToday: {
    color: colors.primary,
  },
  dayTextDisabled: {
    color: colors.border,
  },
  dayStats: {
    marginTop: 2,
    alignItems: 'center',
  },
  dayIncome: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.income,
  },
  dayExpense: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.expense,
  },
});
