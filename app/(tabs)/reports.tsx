import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInRight,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { Colors, getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';
import { useAccounts } from '@/store/useAccounts';
import { useTransactions } from '@/store/useTransactions';
import { AccountForm } from '@/components/AccountForm';
import { MonthComparison } from '@/components/MonthComparison';
import { ExpenseForecast } from '@/components/ExpenseForecast';
import { TopCategories } from '@/components/TopCategories';
import { BalanceTrend } from '@/components/BalanceTrend';
import { Account } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth, getDate } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';
import { getCategoryById } from '@/constants/categories';

type TabType = 'analytics' | 'accounts';

interface MonthlyStats {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  balance: number;
}

export default function ReportsScreen() {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const accounts = useAccounts(state => state.accounts);
  const getTotalBalance = useAccounts(state => state.getTotalBalance);
  const addAccount = useAccounts(state => state.addAccount);
  const updateAccount = useAccounts(state => state.updateAccount);
  const deleteAccount = useAccounts(state => state.deleteAccount);

  const transactions = useTransactions(state => state.transactions);
  const loadTransactions = useTransactions(state => state.loadTransactions);

  useEffect(() => {
    loadTransactions();
  }, []);

  const totalBalance = getTotalBalance();

  // Calculate monthly statistics for last 6 months
  const getMonthlyStats = (): MonthlyStats[] => {
    const stats: MonthlyStats[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

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

      stats.push({
        month: format(monthDate, 'yyyy-MM'),
        monthLabel: format(monthDate, 'LLLL yyyy', { locale: dateFnsPl }),
        income,
        expenses,
        balance: income - expenses,
      });
    }

    return stats;
  };

  const monthlyStats = getMonthlyStats();

  // Get current and previous month data for comparison
  const getCurrentMonthComparison = () => {
    if (monthlyStats.length < 2) return null;

    return {
      currentMonth: {
        income: monthlyStats[0].income,
        expenses: monthlyStats[0].expenses,
        balance: monthlyStats[0].balance,
        label: format(new Date(monthlyStats[0].month), 'MMM', { locale: dateFnsPl }),
      },
      previousMonth: {
        income: monthlyStats[1].income,
        expenses: monthlyStats[1].expenses,
        balance: monthlyStats[1].balance,
        label: format(new Date(monthlyStats[1].month), 'MMM', { locale: dateFnsPl }),
      },
    };
  };

  // Get expense forecast data
  const getExpenseForecastData = () => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const daysInMonth = getDaysInMonth(now);
    const daysElapsed = getDate(now);

    const currentMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= currentMonth && txDate <= now && t.type === 'expense';
    });

    const currentMonthExpenses = currentMonthTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const averageDailyExpense = daysElapsed > 0 ? currentMonthExpenses / daysElapsed : 0;

    // Calculate average of last 3 months
    const lastMonthsExpenses = monthlyStats
      .slice(1, 4)
      .reduce((sum, stat) => sum + stat.expenses, 0);
    const lastMonthsAverage = monthlyStats.length > 1 ? lastMonthsExpenses / Math.min(3, monthlyStats.length - 1) : 0;

    return {
      currentMonthExpenses,
      averageDailyExpense,
      daysElapsed,
      daysInMonth,
      lastMonthsAverage,
    };
  };

  // Get top categories
  const getTopCategories = () => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    const currentMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= currentMonth && txDate <= endMonth && t.type === 'expense';
    });

    const categoryMap = new Map<string, { amount: number; count: number }>();

    currentMonthTransactions.forEach(t => {
      const current = categoryMap.get(t.categoryId) || { amount: 0, count: 0 };
      categoryMap.set(t.categoryId, {
        amount: current.amount + t.amount,
        count: current.count + 1,
      });
    });

    const totalExpenses = currentMonthTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const categoriesData = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => {
        const category = getCategoryById(categoryId);
        return {
          id: categoryId,
          name: category?.name || 'Nieznana',
          icon: category?.icon || 'help-circle',
          color: category?.color || colors.gray,
          amount: data.amount,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          transactionCount: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return categoriesData;
  };

  // Get balance trend data
  const getBalanceTrendData = () => {
    return monthlyStats.map(stat => ({
      month: stat.month,
      balance: stat.balance,
      label: format(new Date(stat.month), 'MMM', { locale: dateFnsPl }),
    })).reverse(); // Reverse to show oldest first
  };

  const comparisonData = getCurrentMonthComparison();
  const forecastData = getExpenseForecastData();
  const topCategoriesData = getTopCategories();
  const balanceTrendData = getBalanceTrendData();

  const handleSaveAccount = async (name: string, icon: string, color: string) => {
    if (editingAccount) {
      await updateAccount({
        ...editingAccount,
        name,
        icon,
        color,
      });
    } else {
      await addAccount(name, icon, color);
    }
    setEditingAccount(null);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = (id: string, name: string) => {
    Alert.alert(
      pl.reports.deleteAccount,
      `Czy na pewno chcesz usunac konto "${name}"? Wszystkie transakcje na tym koncie zostana usuniete.`,
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(id);
            } catch (error) {
              Alert.alert(pl.errors.errorTitle, pl.errors.deleteAccountFailed);
            }
          },
        },
      ]
    );
  };

  const handleCloseForm = () => {
    setShowAccountForm(false);
    setEditingAccount(null);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{pl.reports.title}</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'analytics' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analityka
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accounts' && styles.tabActive]}
          onPress={() => setActiveTab('accounts')}
        >
          <Ionicons
            name="wallet"
            size={20}
            color={activeTab === 'accounts' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'accounts' && styles.tabTextActive]}>
            Konta
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'analytics' ? (
          /* Analytics Tab */
          <View>
            {/* Month Comparison */}
            {comparisonData && (
              <MonthComparison
                currentMonth={comparisonData.currentMonth}
                previousMonth={comparisonData.previousMonth}
                theme={theme}
              />
            )}

            {/* Expense Forecast */}
            <ExpenseForecast
              currentMonthExpenses={forecastData.currentMonthExpenses}
              averageDailyExpense={forecastData.averageDailyExpense}
              daysElapsed={forecastData.daysElapsed}
              daysInMonth={forecastData.daysInMonth}
              lastMonthsAverage={forecastData.lastMonthsAverage}
              theme={theme}
            />

            {/* Top Categories */}
            {topCategoriesData.length > 0 && (
              <TopCategories
                categories={topCategoriesData}
                totalAmount={topCategoriesData.reduce((sum, cat) => sum + cat.amount, 0)}
                theme={theme}
                type="expense"
              />
            )}

            {/* Balance Trend */}
            {balanceTrendData.length > 1 && (
              <BalanceTrend data={balanceTrendData} theme={theme} />
            )}

            <Text style={styles.sectionTitle}>Statystyki miesieczne</Text>

            {monthlyStats.map((stat, index) => (
              <Animated.View
                key={stat.month}
                style={styles.monthCard}
                entering={FadeInRight.delay(index * 100).duration(400)}
                layout={Layout.springify()}
              >
                <Text style={styles.monthLabel}>{stat.monthLabel}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Ionicons name="arrow-up-circle" size={16} color={colors.income} />
                      <Text style={styles.statLabel}>Przychody</Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.income }]}>
                      +{stat.income.toFixed(2)} {pl.common.currency}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Ionicons name="arrow-down-circle" size={16} color={colors.expense} />
                      <Text style={styles.statLabel}>Wydatki</Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.expense }]}>
                      -{stat.expenses.toFixed(2)} {pl.common.currency}
                    </Text>
                  </View>
                </View>

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Bilans miesiaca</Text>
                  <Text style={[
                    styles.balanceValue,
                    { color: stat.balance >= 0 ? colors.income : colors.expense }
                  ]}>
                    {stat.balance >= 0 ? '+' : ''}{stat.balance.toFixed(2)} {pl.common.currency}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressIncome,
                        {
                          flex: stat.income > 0 ? stat.income / (stat.income + stat.expenses || 1) : 0,
                          backgroundColor: colors.income,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.progressExpense,
                        {
                          flex: stat.expenses > 0 ? stat.expenses / (stat.income + stat.expenses || 1) : 0,
                          backgroundColor: colors.expense,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : (
          /* Accounts Tab */
          <View>
            {/* Total Assets */}
            <Animated.View
              style={styles.totalCard}
              entering={FadeInDown.duration(400)}
            >
              <Text style={styles.totalLabel}>Aktywa netto</Text>
              <Text style={[styles.totalAmount, { color: totalBalance >= 0 ? colors.income : colors.expense }]}>
                {totalBalance.toFixed(2)} {pl.common.currency}
              </Text>
            </Animated.View>

            {/* Accounts List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{pl.reports.accounts}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingAccount(null);
                  setShowAccountForm(true);
                }}
              >
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {accounts.map((account, index) => (
              <Animated.View
                key={account.id}
                entering={FadeInRight.delay(index * 100).duration(400)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  style={styles.accountCard}
                  onPress={() => handleEditAccount(account)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                    <Ionicons name={account.icon as any} size={24} color={colors.white} />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={[styles.accountBalance, { color: account.balance >= 0 ? colors.income : colors.expense }]}>
                      {account.balance.toFixed(2)} {pl.common.currency}
                    </Text>
                  </View>
                  <View style={styles.accountActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditAccount(account)}
                    >
                      <Ionicons name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteAccount(account.id, account.name)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.expense} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {accounts.length === 0 && (
              <Animated.View
                style={styles.emptyState}
                entering={FadeInDown.delay(200).duration(400)}
              >
                <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Brak kont</Text>
                <Text style={styles.emptySubtext}>Dodaj pierwsze konto</Text>
              </Animated.View>
            )}

            {/* Hint */}
            <Animated.View
              style={styles.hintContainer}
              entering={FadeInDown.delay(400).duration(400)}
            >
              <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
              <Text style={styles.hintText}>
                Dotknij konto aby edytowac jego nazwe, ikone lub kolor
              </Text>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Account Form Modal */}
      <AccountForm
        visible={showAccountForm}
        onClose={handleCloseForm}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  progressIncome: {
    height: '100%',
  },
  progressExpense: {
    height: '100%',
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
