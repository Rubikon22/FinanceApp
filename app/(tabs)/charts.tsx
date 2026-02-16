import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Modal } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { Colors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { ChartData } from '@/types';
import { useTransactions } from '@/store/useTransactions';
import { getCategoryById } from '@/constants/categories';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function ChartsScreen() {
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const transactions = useTransactions(state => state.transactions);
  const loadTransactions = useTransactions(state => state.loadTransactions);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= startDate && txDate <= endDate;
  });

  const getExpensesByCategory = () => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categoryTotals = new Map<string, number>();
    expenses.forEach(t => {
      const current = categoryTotals.get(t.categoryId) || 0;
      categoryTotals.set(t.categoryId, current + t.amount);
    });
    return categoryTotals;
  };

  const getTotalByType = (type: 'expense' | 'income') => {
    return filteredTransactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const expensesByCategory = getExpensesByCategory();
  const totalExpenses = getTotalByType('expense');
  const totalIncome = getTotalByType('income');

  const chartData: ChartData[] = Array.from(expensesByCategory.entries())
    .map(([categoryId, amount]) => {
      const category = getCategoryById(categoryId);
      return {
        name: category?.name || categoryId,
        amount,
        color: category?.color || Colors.gray,
        legendFontColor: Colors.text,
        legendFontSize: 12,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const handleDayPress = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    if (selectingStart) {
      setStartDate(selectedDate);
      setSelectingStart(false);
    } else {
      if (selectedDate < startDate) {
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      setShowDateModal(false);
      setSelectingStart(true);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');

    marked[start] = {
      startingDay: true,
      color: Colors.primary,
      textColor: Colors.white,
    };
    marked[end] = {
      endingDay: true,
      color: Colors.primary,
      textColor: Colors.white,
    };

    // Mark days in between
    const current = new Date(startDate);
    current.setDate(current.getDate() + 1);
    while (current < endDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      marked[dateStr] = {
        color: Colors.secondary,
        textColor: Colors.white,
      };
      current.setDate(current.getDate() + 1);
    }

    return marked;
  };

  const getDateRangeText = () => {
    return `${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => {
            setSelectingStart(true);
            setShowDateModal(true);
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          <Text style={styles.dateSelectorText}>{getDateRangeText()}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pl.charts.title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Date Range Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingStart ? 'Wybierz date poczatkowa' : 'Wybierz date koncowa'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowDateModal(false);
                setSelectingStart(true);
              }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.selectedDates}>
              <View style={[styles.dateBox, selectingStart && styles.dateBoxActive]}>
                <Text style={styles.dateBoxLabel}>Od</Text>
                <Text style={styles.dateBoxValue}>{format(startDate, 'dd.MM.yyyy')}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} />
              <View style={[styles.dateBox, !selectingStart && styles.dateBoxActive]}>
                <Text style={styles.dateBoxLabel}>Do</Text>
                <Text style={styles.dateBoxValue}>{format(endDate, 'dd.MM.yyyy')}</Text>
              </View>
            </View>

            <Calendar
              onDayPress={handleDayPress}
              markedDates={getMarkedDates()}
              markingType="period"
              theme={{
                backgroundColor: Colors.surface,
                calendarBackground: Colors.surface,
                textSectionTitleColor: Colors.textSecondary,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.primary,
                dayTextColor: Colors.text,
                textDisabledColor: Colors.border,
                arrowColor: Colors.primary,
                monthTextColor: Colors.text,
              }}
            />
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.income }]}>
            <Text style={styles.summaryLabel}>{pl.charts.income}</Text>
            <Text style={[styles.summaryAmount, { color: Colors.income }]}>
              +{totalIncome.toFixed(2)} {pl.common.currency}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.expense }]}>
            <Text style={styles.summaryLabel}>{pl.charts.expenses}</Text>
            <Text style={[styles.summaryAmount, { color: Colors.expense }]}>
              -{totalExpenses.toFixed(2)} {pl.common.currency}
            </Text>
          </View>
        </View>

        {/* Pie Chart */}
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{pl.charts.expenses}</Text>
            <PieChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>{pl.charts.noData}</Text>
          </View>
        )}

        {/* Category Legend */}
        {chartData.length > 0 && (
          <View style={styles.legendContainer}>
            {chartData.map((item, index) => {
              const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
              return (
                <View key={index} style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendName}>{item.name}</Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.legendAmount}>
                      {item.amount.toFixed(2)} {pl.common.currency}
                    </Text>
                    <Text style={styles.legendPercent}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRight: {
    width: 60,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dateSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dateModal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dateBox: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateBoxActive: {
    borderColor: Colors.primary,
  },
  dateBoxLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateBoxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  noDataContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  legendContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendName: {
    fontSize: 14,
    color: Colors.text,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  legendPercent: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
