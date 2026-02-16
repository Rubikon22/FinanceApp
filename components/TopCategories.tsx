import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { getThemeColors } from '@/constants/colors';
import { ThemeMode } from '@/types';
import { pl } from '@/i18n/pl';

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface TopCategoriesProps {
  categories: CategoryData[];
  totalAmount: number;
  theme: ThemeMode;
  type?: 'expense' | 'income';
}

export const TopCategories: React.FC<TopCategoriesProps> = ({
  categories,
  totalAmount,
  theme,
  type = 'expense',
}) => {
  const colors = getThemeColors(theme);

  // Топ-5 категорий
  const topCategories = categories.slice(0, 5);

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeInRight.delay(200).duration(400)}
    >
      <View style={styles.header}>
        <Ionicons name="trophy" size={20} color={colors.primary} />
        <Text style={styles.title}>
          Top 5 kategorii {type === 'expense' ? 'wydatkow' : 'przychodow'}
        </Text>
      </View>

      {topCategories.length > 0 ? (
        <View style={styles.categoriesList}>
          {topCategories.map((category, index) => (
            <Animated.View
              key={category.id}
              style={styles.categoryRow}
              entering={FadeInRight.delay(100 * (index + 1)).duration(400)}
            >
              {/* Rank Badge */}
              <View
                style={[
                  styles.rankBadge,
                  index === 0 && styles.rankBadgeGold,
                  index === 1 && styles.rankBadgeSilver,
                  index === 2 && styles.rankBadgeBronze,
                ]}
              >
                <Text
                  style={[
                    styles.rankText,
                    index < 3 && styles.rankTextHighlight,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              {/* Category Icon */}
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: `${category.color}20` },
                ]}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={category.color}
                />
              </View>

              {/* Category Info */}
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.categoryStats}>
                  <Text style={styles.transactionCount}>
                    {category.transactionCount}{' '}
                    {category.transactionCount === 1
                      ? 'transakcja'
                      : category.transactionCount < 5
                      ? 'transakcje'
                      : 'transakcji'}
                  </Text>
                </View>
              </View>

              {/* Amount & Percentage */}
              <View style={styles.amountSection}>
                <Text
                  style={[
                    styles.amountText,
                    { color: type === 'expense' ? colors.expense : colors.income },
                  ]}
                >
                  {category.amount.toFixed(2)} {pl.common.currency}
                </Text>
                <Text style={styles.percentageText}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>
            </Animated.View>
          ))}

          {/* Progress bars */}
          <View style={styles.progressSection}>
            {topCategories.map((category, index) => (
              <View key={`progress-${category.id}`} style={styles.progressRow}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: `${category.color}30` },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${category.percentage}%`,
                        backgroundColor: category.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Brak danych</Text>
        </View>
      )}

      {/* Summary */}
      {topCategories.length > 0 && (
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Łaczna suma (Top 5):</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: type === 'expense' ? colors.expense : colors.income },
              ]}
            >
              {topCategories
                .reduce((sum, cat) => sum + cat.amount, 0)
                .toFixed(2)}{' '}
              {pl.common.currency}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Procent z calości:</Text>
            <Text style={styles.summaryValue}>
              {topCategories
                .reduce((sum, cat) => sum + cat.percentage, 0)
                .toFixed(1)}
              %
            </Text>
          </View>
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
    categoriesList: {
      gap: 12,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rankBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rankBadgeGold: {
      backgroundColor: '#FFD700',
    },
    rankBadgeSilver: {
      backgroundColor: '#C0C0C0',
    },
    rankBadgeBronze: {
      backgroundColor: '#CD7F32',
    },
    rankText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    rankTextHighlight: {
      color: '#FFFFFF',
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    categoryStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionCount: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    amountSection: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontSize: 15,
      fontWeight: '700',
    },
    percentageText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressSection: {
      marginTop: 8,
      gap: 6,
    },
    progressRow: {
      height: 6,
    },
    progressBar: {
      height: '100%',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    summarySection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
  });
