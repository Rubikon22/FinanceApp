import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';
import { ChartData } from '@/types';
import { useTransactions } from '@/store/useTransactions';
import { getCategoryById } from '@/constants/categories';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function ChartsScreen() {
  const router = useRouter();
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

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
        color: category?.color || colors.gray,
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const getDateRangeText = () => {
    return `${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')}`;
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => router.push('/calendar' as any)}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.dateSelectorText}>{getDateRangeText()}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pl.charts.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderLeftColor: colors.income }]}>
            <Text style={styles.summaryLabel}>{pl.charts.income}</Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              +{totalIncome.toFixed(2)} {pl.common.currency}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: colors.expense }]}>
            <Text style={styles.summaryLabel}>{pl.charts.expenses}</Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 60,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dateSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  noDataContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  legendContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  legendPercent: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
