import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getThemeColors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { useAuth } from '@/store/useAuth';
import { useTheme } from '@/store/useTheme';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { useRecurring } from '@/store/useRecurring';
import { useBudgets } from '@/store/useBudgets';
import { exportToJSON, exportToCSV, shareFile } from '@/services/export';
import { clearAllData } from '@/services/database';
import { RecurringTransactionForm } from '@/components/RecurringTransactionForm';
import { BudgetForm } from '@/components/BudgetForm';
import { BudgetProgressCard } from '@/components/BudgetProgressCard';
import { getCategoryById } from '@/constants/categories';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecurringList, setShowRecurringList] = useState(false);
  const [showBudgetList, setShowBudgetList] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const user = useAuth(state => state.user);
  const isAuthenticated = useAuth(state => state.isAuthenticated);
  const login = useAuth(state => state.login);
  const logout = useAuth(state => state.logout);

  const theme = useTheme(state => state.theme);
  const toggleTheme = useTheme(state => state.toggleTheme);
  const loadTheme = useTheme(state => state.loadTheme);

  const transactions = useTransactions(state => state.transactions);
  const loadTransactions = useTransactions(state => state.loadTransactions);
  const addTransaction = useTransactions(state => state.addTransaction);
  const getExpensesByCategory = useTransactions(state => state.getExpensesByCategory);

  const accounts = useAccounts(state => state.accounts);
  const loadAccounts = useAccounts(state => state.loadAccounts);

  const recurringTransactions = useRecurring(state => state.recurringTransactions);
  const loadRecurringTransactions = useRecurring(state => state.loadRecurringTransactions);
  const addRecurringTransaction = useRecurring(state => state.addRecurringTransaction);
  const deleteRecurringTransaction = useRecurring(state => state.deleteRecurringTransaction);
  const toggleRecurringActive = useRecurring(state => state.toggleRecurringActive);
  const processDueTransactions = useRecurring(state => state.processDueTransactions);

  const budgets = useBudgets(state => state.budgets);
  const loadBudgets = useBudgets(state => state.loadBudgets);
  const addBudget = useBudgets(state => state.addBudget);
  const deleteBudget = useBudgets(state => state.deleteBudget);
  const calculateBudgetProgress = useBudgets(state => state.calculateBudgetProgress);

  const colors = getThemeColors(theme);

  useEffect(() => {
    loadTheme();
    loadRecurringTransactions();
    loadBudgets();
  }, []);

  // Process due recurring transactions on app start
  useEffect(() => {
    const processRecurring = async () => {
      try {
        const count = await processDueTransactions(addTransaction);
        if (count > 0) {
          Alert.alert(
            pl.recurring.title,
            `${pl.recurring.processed}: ${count}`
          );
          loadTransactions();
          loadAccounts();
        }
      } catch (error) {
        console.error('Error processing recurring transactions:', error);
      }
    };
    processRecurring();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(pl.errors.errorTitle, 'Wprowadz email i haslo');
      return;
    }
    try {
      await login(email.trim(), password);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert(pl.errors.errorTitle, pl.errors.loginFailed);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      pl.profile.logout,
      'Czy na pewno chcesz sie wylogowac?',
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.profile.logout,
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleExport = () => {
    Alert.alert(
      pl.settings.exportData,
      pl.settings.exportFormat,
      [
        {
          text: pl.settings.exportJSON,
          onPress: () => exportData('json'),
        },
        {
          text: pl.settings.exportCSV,
          onPress: () => exportData('csv'),
        },
        { text: pl.common.cancel, style: 'cancel' },
      ]
    );
  };

  const exportData = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      let filePath: string;
      if (format === 'json') {
        filePath = await exportToJSON(transactions, accounts);
      } else {
        filePath = await exportToCSV(transactions, accounts);
      }
      await shareFile(filePath);
      Alert.alert(pl.settings.exportSuccess);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(pl.errors.errorTitle, pl.settings.exportFailed);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      pl.settings.clearData,
      pl.settings.clearDataConfirm,
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await loadTransactions();
              await loadAccounts();
              await loadRecurringTransactions();
              await loadBudgets();
              Alert.alert('Dane zostaly usuniete');
            } catch (error) {
              Alert.alert(pl.errors.errorTitle, pl.errors.generic);
            }
          },
        },
      ]
    );
  };

  const handleDeleteRecurring = (id: string) => {
    Alert.alert(
      pl.common.delete,
      pl.recurring.deleteConfirm,
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.delete,
          style: 'destructive',
          onPress: () => deleteRecurringTransaction(id),
        },
      ]
    );
  };

  const handleDeleteBudget = (id: string) => {
    Alert.alert(
      pl.common.delete,
      pl.budgets.deleteConfirm,
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.delete,
          style: 'destructive',
          onPress: () => deleteBudget(id),
        },
      ]
    );
  };

  const budgetProgress = calculateBudgetProgress(getExpensesByCategory());

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{pl.profile.title}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={colors.white} />
          </View>
          <View style={styles.userInfo}>
            {isAuthenticated && user ? (
              <>
                <Text style={styles.userName}>{user.displayName || user.email}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </>
            ) : (
              <>
                <Text style={styles.userName}>{pl.profile.guest}</Text>
                <Text style={styles.userEmail}>Niezalogowany</Text>
              </>
            )}
          </View>
        </View>

        {/* Auth Button */}
        {!isAuthenticated ? (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setShowLoginModal(true)}
          >
            <Ionicons name="log-in-outline" size={24} color={colors.white} />
            <Text style={styles.loginButtonText}>{pl.profile.login}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.expense }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.white} />
            <Text style={styles.loginButtonText}>{pl.profile.logout}</Text>
          </TouchableOpacity>
        )}

        {/* Recurring Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{pl.recurring.title}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowRecurringModal(true)}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {recurringTransactions.length === 0 ? (
            <Text style={styles.emptyText}>{pl.recurring.noRecurring}</Text>
          ) : (
            <>
              {recurringTransactions.slice(0, 3).map((recurring) => {
                const category = getCategoryById(recurring.categoryId);
                const account = accounts.find(a => a.id === recurring.accountId);
                return (
                  <View key={recurring.id} style={styles.recurringItem}>
                    <View style={styles.recurringLeft}>
                      <View style={[styles.recurringIcon, { backgroundColor: category?.color }]}>
                        <Ionicons name={category?.icon as any} size={20} color={colors.white} />
                      </View>
                      <View>
                        <Text style={styles.recurringName}>{category?.name}</Text>
                        <Text style={styles.recurringDetails}>
                          {recurring.frequency === 'daily' && pl.recurring.daily}
                          {recurring.frequency === 'weekly' && pl.recurring.weekly}
                          {recurring.frequency === 'monthly' && pl.recurring.monthly}
                          {recurring.frequency === 'yearly' && pl.recurring.yearly}
                          {' • '}{account?.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recurringRight}>
                      <Text style={[
                        styles.recurringAmount,
                        { color: recurring.type === 'expense' ? colors.expense : colors.income }
                      ]}>
                        {recurring.type === 'expense' ? '-' : '+'}{recurring.amount.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleRecurringActive(recurring.id)}
                      >
                        <Ionicons
                          name={recurring.isActive ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={recurring.isActive ? colors.income : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {recurringTransactions.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowRecurringList(true)}
                >
                  <Text style={styles.showMoreText}>
                    Pokaz wszystkie ({recurringTransactions.length})
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Budgets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{pl.budgets.title}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowBudgetModal(true)}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {budgetProgress.length === 0 ? (
            <Text style={styles.emptyText}>{pl.budgets.noBudgets}</Text>
          ) : (
            budgetProgress.slice(0, 2).map((progress) => (
              <BudgetProgressCard
                key={progress.budget.id}
                progress={progress}
                onDelete={() => handleDeleteBudget(progress.budget.id)}
              />
            ))
          )}
          {budgetProgress.length > 2 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowBudgetList(true)}
            >
              <Text style={styles.showMoreText}>
                Pokaz wszystkie ({budgetProgress.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Chatbot */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/chatbot')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FF6B9D' }]}>
                <Ionicons name="sparkles" size={20} color={colors.white} />
              </View>
              <Text style={styles.menuItemText}>Asystent AI</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowSettingsModal(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="settings-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.menuItemText}>{pl.profile.settings}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.transfer }]}>
                <Ionicons name="sync-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.menuItemText}>{pl.profile.sync}</Text>
            </View>
            <Text style={styles.menuItemValue}>
              {isAuthenticated ? pl.profile.syncEnabled : pl.profile.syncDisabled}
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.gray }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.menuItemText}>{pl.profile.version}</Text>
            </View>
            <Text style={styles.menuItemValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pl.profile.login}</Text>
              <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Haslo"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
              <Text style={styles.submitButtonText}>{pl.profile.login}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pl.settings.title}</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={24} color={colors.text} />
                <Text style={styles.settingText}>{pl.profile.darkMode}</Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.gray, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="globe-outline" size={24} color={colors.text} />
                <Text style={styles.settingText}>{pl.profile.language}</Text>
              </View>
              <Text style={styles.settingValue}>Polski</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleExport}
              disabled={isExporting}
            >
              <View style={styles.settingLeft}>
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="download-outline" size={24} color={colors.text} />
                )}
                <Text style={styles.settingText}>{pl.settings.exportData}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleClearData}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={24} color={colors.expense} />
                <Text style={[styles.settingText, { color: colors.expense }]}>
                  {pl.settings.clearData}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recurring Transaction Form Modal */}
      <RecurringTransactionForm
        visible={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onSave={addRecurringTransaction}
      />

      {/* Budget Form Modal */}
      <BudgetForm
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSave={addBudget}
        existingBudgets={budgets}
      />

      {/* Full Recurring List Modal */}
      <Modal
        visible={showRecurringList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecurringList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pl.recurring.title}</Text>
              <TouchableOpacity onPress={() => setShowRecurringList(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {recurringTransactions.map((recurring) => {
                const category = getCategoryById(recurring.categoryId);
                const account = accounts.find(a => a.id === recurring.accountId);
                return (
                  <View key={recurring.id} style={styles.recurringItem}>
                    <View style={styles.recurringLeft}>
                      <View style={[styles.recurringIcon, { backgroundColor: category?.color }]}>
                        <Ionicons name={category?.icon as any} size={20} color={colors.white} />
                      </View>
                      <View>
                        <Text style={styles.recurringName}>{category?.name}</Text>
                        <Text style={styles.recurringDetails}>
                          {recurring.frequency === 'daily' && pl.recurring.daily}
                          {recurring.frequency === 'weekly' && pl.recurring.weekly}
                          {recurring.frequency === 'monthly' && pl.recurring.monthly}
                          {recurring.frequency === 'yearly' && pl.recurring.yearly}
                          {' • '}{account?.name}
                        </Text>
                        <Text style={styles.recurringNext}>
                          {pl.recurring.nextOccurrence}: {format(new Date(recurring.nextOccurrence), 'dd.MM.yyyy')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recurringActions}>
                      <Text style={[
                        styles.recurringAmount,
                        { color: recurring.type === 'expense' ? colors.expense : colors.income }
                      ]}>
                        {recurring.type === 'expense' ? '-' : '+'}{recurring.amount.toFixed(2)}
                      </Text>
                      <View style={styles.recurringButtons}>
                        <TouchableOpacity
                          onPress={() => toggleRecurringActive(recurring.id)}
                          style={styles.actionButton}
                        >
                          <Ionicons
                            name={recurring.isActive ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={recurring.isActive ? colors.income : colors.textSecondary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteRecurring(recurring.id)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Budget List Modal */}
      <Modal
        visible={showBudgetList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBudgetList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pl.budgets.title}</Text>
              <TouchableOpacity onPress={() => setShowBudgetList(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {budgetProgress.map((progress) => (
                <BudgetProgressCard
                  key={progress.budget.id}
                  progress={progress}
                  onDelete={() => handleDeleteBudget(progress.budget.id)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recurringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recurringIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recurringName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  recurringDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recurringNext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recurringRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recurringActions: {
    alignItems: 'flex-end',
  },
  recurringButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 4,
  },
  recurringAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
