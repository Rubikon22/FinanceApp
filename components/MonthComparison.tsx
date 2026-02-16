import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { getThemeColors } from '@/constants/colors';
import { ThemeMode } from '@/types';
import { pl } from '@/i18n/pl';

interface MonthComparisonProps {
  currentMonth: {
    income: number;
    expenses: number;
    balance: number;
    label: string;
  };
  previousMonth: {
    income: number;
    expenses: number;
    balance: number;
    label: string;
  };
  theme: ThemeMode;
}

export const MonthComparison: React.FC<MonthComparisonProps> = ({
  currentMonth,
  previousMonth,
  theme,
}) => {
  const colors = getThemeColors(theme);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percent: 0, direction: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    return { percent: Math.abs(change), direction };
  };

  const incomeChange = calculateChange(currentMonth.income, previousMonth.income);
  const expensesChange = calculateChange(currentMonth.expenses, previousMonth.expenses);
  const balanceChange = calculateChange(currentMonth.balance, previousMonth.balance);

  const renderChange = (
    label: string,
    current: number,
    previous: number,
    change: ReturnType<typeof calculateChange>,
    isExpense: boolean = false
  ) => {
    const isGoodChange = isExpense
      ? change.direction === 'down'
      : change.direction === 'up';

    const changeColor =
      change.direction === 'neutral'
        ? colors.textSecondary
        : isGoodChange
        ? colors.income
        : colors.expense;

    const icon =
      change.direction === 'up'
        ? 'trending-up'
        : change.direction === 'down'
        ? 'trending-down'
        : 'remove';

    return (
      <View style={styles.comparisonRow}>
        <Text style={styles.comparisonLabel}>{label}</Text>
        <View style={styles.comparisonValues}>
          <View style={styles.valueColumn}>
            <Text style={styles.periodLabel}>{currentMonth.label}</Text>
            <Text style={[styles.valueText, { color: colors.text }]}>
              {current.toFixed(2)} {pl.common.currency}
            </Text>
          </View>
          <View style={styles.changeIndicator}>
            <Ionicons name={icon} size={16} color={changeColor} />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {change.percent.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.valueColumn}>
            <Text style={styles.periodLabel}>{previousMonth.label}</Text>
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>
              {previous.toFixed(2)} {pl.common.currency}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeInRight.duration(400)}
    >
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color={colors.primary} />
        <Text style={styles.title}>Porownanie miesiecy</Text>
      </View>

      <View style={styles.comparisonContent}>
        {renderChange(
          'Przychody',
          currentMonth.income,
          previousMonth.income,
          incomeChange,
          false
        )}
        {renderChange(
          'Wydatki',
          currentMonth.expenses,
          previousMonth.expenses,
          expensesChange,
          true
        )}
        {renderChange(
          'Bilans',
          currentMonth.balance,
          previousMonth.balance,
          balanceChange,
          false
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    comparisonContent: {
      gap: 16,
    },
    comparisonRow: {
      gap: 8,
    },
    comparisonLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    comparisonValues: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    valueColumn: {
      flex: 1,
    },
    periodLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    valueText: {
      fontSize: 14,
      fontWeight: '600',
    },
    changeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
    },
    changeText: {
      fontSize: 14,
      fontWeight: '700',
    },
  });
