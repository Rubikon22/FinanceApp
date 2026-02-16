import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { getThemeColors } from '@/constants/colors';
import { ThemeMode } from '@/types';
import { pl } from '@/i18n/pl';
import { format, getDaysInMonth } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';

interface ExpenseForecastProps {
  currentMonthExpenses: number;
  averageDailyExpense: number;
  daysElapsed: number;
  daysInMonth: number;
  lastMonthsAverage: number;
  theme: ThemeMode;
}

export const ExpenseForecast: React.FC<ExpenseForecastProps> = ({
  currentMonthExpenses,
  averageDailyExpense,
  daysElapsed,
  daysInMonth,
  lastMonthsAverage,
  theme,
}) => {
  const colors = getThemeColors(theme);

  // Прогноз на основе текущих трат
  const currentTrendForecast = averageDailyExpense * daysInMonth;

  // Прогноз на основе исторических данных
  const historicalForecast = lastMonthsAverage;

  // Комбинированный прогноз (средневзвешенный)
  const weight = daysElapsed / daysInMonth; // Вес текущего тренда
  const combinedForecast =
    currentTrendForecast * weight + historicalForecast * (1 - weight);

  // Прогноз оставшихся дней
  const remainingDays = daysInMonth - daysElapsed;
  const projectedRemainingExpenses = averageDailyExpense * remainingDays;

  // Сравнение с историческими данными
  const vsHistorical = combinedForecast - historicalForecast;
  const vsHistoricalPercent =
    historicalForecast > 0 ? (vsHistorical / historicalForecast) * 100 : 0;

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeInRight.delay(100).duration(400)}
    >
      <View style={styles.header}>
        <Ionicons name="trending-up" size={20} color={colors.primary} />
        <Text style={styles.title}>Prognoza wydatkow</Text>
      </View>

      {/* Current Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Dzien {daysElapsed} z {daysInMonth}
          </Text>
          <Text style={styles.progressPercent}>
            {Math.round((daysElapsed / daysInMonth) * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(daysElapsed / daysInMonth) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Forecast Cards */}
      <View style={styles.forecastCards}>
        {/* Current Month */}
        <View style={[styles.forecastCard, styles.forecastCardPrimary]}>
          <Text style={styles.forecastCardLabel}>Aktualne wydatki</Text>
          <Text style={[styles.forecastCardValue, { color: colors.text }]}>
            {currentMonthExpenses.toFixed(2)}
          </Text>
          <Text style={styles.forecastCardCurrency}>{pl.common.currency}</Text>
        </View>

        {/* Projected Total */}
        <View style={[styles.forecastCard, styles.forecastCardSecondary]}>
          <Text style={styles.forecastCardLabel}>Prognoza na miesiac</Text>
          <Text style={[styles.forecastCardValue, { color: colors.expense }]}>
            {combinedForecast.toFixed(2)}
          </Text>
          <Text style={styles.forecastCardCurrency}>{pl.common.currency}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          </View>
          <Text style={styles.detailLabel}>Pozostalo dni:</Text>
          <Text style={styles.detailValue}>{remainingDays}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
          </View>
          <Text style={styles.detailLabel}>Srednia dzienna:</Text>
          <Text style={styles.detailValue}>
            {averageDailyExpense.toFixed(2)} {pl.common.currency}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="stats-chart-outline" size={16} color={colors.textSecondary} />
          </View>
          <Text style={styles.detailLabel}>Prognoza reszty:</Text>
          <Text style={styles.detailValue}>
            {projectedRemainingExpenses.toFixed(2)} {pl.common.currency}
          </Text>
        </View>
      </View>

      {/* Comparison */}
      {historicalForecast > 0 && (
        <View
          style={[
            styles.comparisonBanner,
            {
              backgroundColor:
                vsHistoricalPercent > 10
                  ? `${colors.expense}20`
                  : vsHistoricalPercent < -10
                  ? `${colors.income}20`
                  : `${colors.textSecondary}15`,
            },
          ]}
        >
          <Ionicons
            name={
              vsHistoricalPercent > 0
                ? 'arrow-up-circle'
                : vsHistoricalPercent < 0
                ? 'arrow-down-circle'
                : 'remove-circle'
            }
            size={18}
            color={
              vsHistoricalPercent > 10
                ? colors.expense
                : vsHistoricalPercent < -10
                ? colors.income
                : colors.textSecondary
            }
          />
          <Text style={styles.comparisonText}>
            {vsHistoricalPercent > 0 ? '+' : ''}
            {vsHistoricalPercent.toFixed(1)}% wzgledem sredniej{' '}
            ({lastMonthsAverage.toFixed(2)} {pl.common.currency})
          </Text>
        </View>
      )}
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
    progressSection: {
      marginBottom: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    progressPercent: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.card,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    forecastCards: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    forecastCard: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    forecastCardPrimary: {
      backgroundColor: `${colors.primary}15`,
    },
    forecastCardSecondary: {
      backgroundColor: `${colors.expense}15`,
    },
    forecastCardLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
    },
    forecastCardValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    forecastCardCurrency: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    detailsSection: {
      gap: 10,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailIcon: {
      width: 24,
      alignItems: 'center',
    },
    detailLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    comparisonBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 10,
    },
    comparisonText: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      lineHeight: 16,
    },
  });
