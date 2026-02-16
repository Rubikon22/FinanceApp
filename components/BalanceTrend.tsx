import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { getThemeColors } from '@/constants/colors';
import { ThemeMode } from '@/types';
import { pl } from '@/i18n/pl';

interface BalanceDataPoint {
  month: string;
  balance: number;
  label: string;
}

interface BalanceTrendProps {
  data: BalanceDataPoint[];
  theme: ThemeMode;
}

export const BalanceTrend: React.FC<BalanceTrendProps> = ({ data, theme }) => {
  const colors = getThemeColors(theme);
  const screenWidth = Dimensions.get('window').width;

  // Prepare data for chart
  const balances = data.map((d) => d.balance);
  const labels = data.map((d) => d.label);

  // Calculate statistics
  const maxBalance = Math.max(...balances);
  const minBalance = Math.min(...balances);
  const avgBalance = balances.reduce((sum, val) => sum + val, 0) / balances.length;
  const trend =
    balances.length > 1
      ? balances[balances.length - 1] - balances[0]
      : 0;
  const trendPercent =
    balances[0] !== 0 ? (trend / Math.abs(balances[0])) * 100 : 0;

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`, // primary color
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeInRight.delay(300).duration(400)}
    >
      <View style={styles.header}>
        <Ionicons name="trending-up" size={20} color={colors.primary} />
        <Text style={styles.title}>Dynamika bilansu</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-up" size={16} color={colors.income} />
          </View>
          <Text style={styles.statLabel}>Maksimum</Text>
          <Text style={[styles.statValue, { color: colors.income }]}>
            {maxBalance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="remove" size={16} color={colors.primary} />
          </View>
          <Text style={styles.statLabel}>Srednia</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {avgBalance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-down" size={16} color={colors.expense} />
          </View>
          <Text style={styles.statLabel}>Minimum</Text>
          <Text style={[styles.statValue, { color: colors.expense }]}>
            {minBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Chart */}
      {data.length > 0 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: labels,
              datasets: [
                {
                  data: balances,
                  color: (opacity = 1) => colors.primary,
                  strokeWidth: 3,
                },
              ],
            }}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
            formatYLabel={(value) => {
              const num = parseFloat(value);
              if (Math.abs(num) >= 1000) {
                return `${(num / 1000).toFixed(1)}k`;
              }
              return num.toFixed(0);
            }}
          />
        </View>
      )}

      {/* Trend Indicator */}
      <View
        style={[
          styles.trendBanner,
          {
            backgroundColor:
              trend > 0
                ? `${colors.income}20`
                : trend < 0
                ? `${colors.expense}20`
                : `${colors.textSecondary}15`,
          },
        ]}
      >
        <Ionicons
          name={
            trend > 0
              ? 'trending-up'
              : trend < 0
              ? 'trending-down'
              : 'remove'
          }
          size={20}
          color={
            trend > 0
              ? colors.income
              : trend < 0
              ? colors.expense
              : colors.textSecondary
          }
        />
        <View style={styles.trendContent}>
          <Text style={styles.trendLabel}>
            {trend > 0 ? 'Wzrost' : trend < 0 ? 'Spadek' : 'Bez zmian'}
          </Text>
          <Text style={styles.trendValue}>
            {trend > 0 ? '+' : ''}
            {trend.toFixed(2)} {pl.common.currency} ({trendPercent > 0 ? '+' : ''}
            {trendPercent.toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* Insight */}
      <View style={styles.insightContainer}>
        <Ionicons name="bulb-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.insightText}>
          {trend > 0
            ? 'Twoj bilans rosnie! Kontynuuj dobre nawyki finansowe.'
            : trend < 0
            ? 'Twoj bilans maleje. Rozważ zmniejszenie wydatkow.'
            : 'Twoj bilans jest stabilny w ostatnich miesiacach.'}
        </Text>
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
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: 6,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    chartContainer: {
      alignItems: 'center',
      marginBottom: 16,
      overflow: 'hidden',
      borderRadius: 12,
    },
    chart: {
      borderRadius: 12,
    },
    trendBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
    },
    trendContent: {
      flex: 1,
    },
    trendLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    trendValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    insightContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: `${colors.primary}10`,
      padding: 12,
      borderRadius: 10,
    },
    insightText: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      lineHeight: 16,
    },
  });
