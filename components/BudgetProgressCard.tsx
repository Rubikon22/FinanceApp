import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { Budget } from '@/types';
import { getCategoryById } from '@/constants/categories';

interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

interface Props {
  progress: BudgetProgress;
  onPress?: () => void;
  onDelete?: () => void;
}

export const BudgetProgressCard: React.FC<Props> = ({ progress, onPress, onDelete }) => {
  const { budget, spent, remaining, percentage, isOverBudget, isNearLimit } = progress;
  const category = getCategoryById(budget.categoryId);

  if (!category) return null;

  const progressColor = isOverBudget
    ? Colors.expense
    : isNearLimit
    ? Colors.warning
    : Colors.income;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
            <Ionicons name={category.icon as any} size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.periodText}>
              {budget.period === 'month' ? pl.budgets.monthly : pl.budgets.yearly}
            </Text>
          </View>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.expense} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.percentageText, { color: progressColor }]}>
          {percentage.toFixed(0)}%
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{pl.budgets.spent}</Text>
          <Text style={[styles.statValue, { color: Colors.expense }]}>
            {spent.toFixed(2)} {pl.common.currency}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{pl.budgets.limit}</Text>
          <Text style={styles.statValue}>
            {budget.amount.toFixed(2)} {pl.common.currency}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{pl.budgets.remaining}</Text>
          <Text style={[styles.statValue, { color: remaining >= 0 ? Colors.income : Colors.expense }]}>
            {remaining.toFixed(2)} {pl.common.currency}
          </Text>
        </View>
      </View>

      {isOverBudget && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={16} color={Colors.expense} />
          <Text style={styles.warningText}>{pl.budgets.overBudget}</Text>
        </View>
      )}

      {isNearLimit && !isOverBudget && (
        <View style={[styles.warningBanner, { backgroundColor: `${Colors.warning}20` }]}>
          <Ionicons name="alert-circle" size={16} color={Colors.warning} />
          <Text style={[styles.warningText, { color: Colors.warning }]}>{pl.budgets.nearLimit}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  periodText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
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
    height: 30,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.expense}20`,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.expense,
  },
});
