import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';
import { TransactionType, Category, Account } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { CategoryGrid } from '@/components/CategoryPicker';
import { AccountPicker } from '@/components/AccountPicker';
import { format } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';
import { getCategorySuggestion } from '@/services/aiCategorization';
import { getCategoryById } from '@/constants/categories';
import { ReceiptPicker } from '@/components/ReceiptPicker';

type TabType = 'expense' | 'income' | 'transfer';

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note?: string;
  date: string;
  receiptUri?: string;
}

export interface TransactionFormInitialValues {
  type: TabType;
  amount: string;
  category: Category | null;
  account: Account | null;
  toAccount: Account | null;
  note: string;
  date: Date;
  receiptUri?: string;
}

interface TransactionFormProps {
  title: string;
  saveButtonText: string;
  accounts: Account[];
  initialValues?: TransactionFormInitialValues;
  isSaving: boolean;
  onSave: (data: TransactionFormData) => Promise<void>;
}

const DEFAULT_INITIAL_VALUES: TransactionFormInitialValues = {
  type: 'expense',
  amount: '',
  category: null,
  account: null,
  toAccount: null,
  note: '',
  date: new Date(),
  receiptUri: undefined,
};

export const TransactionForm: React.FC<TransactionFormProps> = ({
  title,
  saveButtonText,
  accounts,
  initialValues = DEFAULT_INITIAL_VALUES,
  isSaving,
  onSave,
}) => {
  const router = useRouter();

  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const TABS: { key: TabType; label: string; color: string }[] = [
    { key: 'expense', label: pl.transaction.expense, color: colors.expense },
    { key: 'income', label: pl.transaction.income, color: colors.income },
    { key: 'transfer', label: pl.transaction.transfer, color: colors.transfer },
  ];

  const [activeTab, setActiveTab] = useState<TabType>(initialValues.type);
  const [amount, setAmount] = useState(initialValues.amount);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(initialValues.category);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(initialValues.account);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(initialValues.toAccount);
  const [note, setNote] = useState(initialValues.note);
  const [date, setDate] = useState(initialValues.date);
  const [showCalendar, setShowCalendar] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(initialValues.receiptUri ?? null);
  const [aiSuggestion, setAiSuggestion] = useState<{
    categoryId: string;
    confidence: 'high' | 'medium' | 'low';
  } | null>(null);

  const currentCategories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCategory(null);
    setAiSuggestion(null);
    // Re-check AI suggestion for current note
    if (note.trim().length > 2 && tab !== 'transfer') {
      const suggestion = getCategorySuggestion(note, tab);
      if (suggestion.categoryId) {
        setAiSuggestion(suggestion as any);
      }
    }
  };

  // Handle note change and trigger AI categorization
  const handleNoteChange = (text: string) => {
    setNote(text);

    // Only suggest for expense and income, not transfer
    if (activeTab === 'transfer') {
      setAiSuggestion(null);
      return;
    }

    // Trigger AI categorization after 2 characters
    if (text.trim().length > 2) {
      const suggestion = getCategorySuggestion(text, activeTab);
      if (suggestion.categoryId) {
        setAiSuggestion(suggestion as any);
      } else {
        setAiSuggestion(null);
      }
    } else {
      setAiSuggestion(null);
    }
  };

  // Apply AI suggestion
  const applyAiSuggestion = () => {
    if (aiSuggestion?.categoryId) {
      const category = getCategoryById(aiSuggestion.categoryId);
      if (category) {
        setSelectedCategory(category);
        setAiSuggestion(null);
      }
    }
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setDate(new Date(day.dateString));
    setShowCalendar(false);
  };

  const handleSave = async () => {
    const amountValue = parseFloat(amount.replace(',', '.'));

    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert(pl.errors.errorTitle, pl.errors.invalidAmount);
      return;
    }

    if (activeTab !== 'transfer' && !selectedCategory) {
      Alert.alert(pl.errors.errorTitle, pl.errors.selectCategory);
      return;
    }

    if (!selectedAccount) {
      Alert.alert(pl.errors.errorTitle, pl.errors.selectAccount);
      return;
    }

    if (activeTab === 'transfer' && !selectedToAccount) {
      Alert.alert(pl.errors.errorTitle, pl.errors.selectAccount);
      return;
    }

    if (activeTab === 'transfer' && selectedAccount?.id === selectedToAccount?.id) {
      Alert.alert(pl.errors.errorTitle, pl.errors.sameAccount);
      return;
    }

    try {
      await onSave({
        type: activeTab as TransactionType,
        amount: amountValue,
        categoryId: activeTab === 'transfer' ? 'transfer' : selectedCategory!.id,
        accountId: selectedAccount.id,
        toAccountId: activeTab === 'transfer' ? selectedToAccount?.id : undefined,
        note: note.trim() || undefined,
        date: format(date, 'yyyy-MM-dd'),
        receiptUri: receiptUri ?? undefined,
      });
    } catch (error) {
      Alert.alert(pl.errors.errorTitle, pl.errors.saveFailed);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: tab.color },
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.label}>{pl.add.amount}</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currency}>{pl.common.currency}</Text>
            </View>
          </View>

          {/* Categories (not for transfer) */}
          {activeTab !== 'transfer' && (
            <View style={styles.section}>
              <Text style={styles.label}>{pl.add.category}</Text>
              <CategoryGrid
                categories={currentCategories}
                selectedId={selectedCategory?.id || null}
                onSelect={setSelectedCategory}
              />
            </View>
          )}

          {/* Account Selection */}
          <View style={styles.section}>
            <AccountPicker
              accounts={accounts}
              selectedId={selectedAccount?.id || null}
              onSelect={setSelectedAccount}
              label={activeTab === 'transfer' ? pl.add.fromAccount : pl.add.account}
            />
          </View>

          {/* To Account (for transfer) */}
          {activeTab === 'transfer' && (
            <View style={styles.section}>
              <AccountPicker
                accounts={accounts.filter(a => a.id !== selectedAccount?.id)}
                selectedId={selectedToAccount?.id || null}
                onSelect={setSelectedToAccount}
                label={pl.add.toAccount}
              />
            </View>
          )}

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.label}>{pl.add.note}</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={handleNoteChange}
              placeholder={pl.add.notePlaceholder}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
            />

            {/* AI Category Suggestion */}
            {aiSuggestion && !selectedCategory && activeTab !== 'transfer' && (
              <TouchableOpacity
                style={styles.aiSuggestion}
                onPress={applyAiSuggestion}
                activeOpacity={0.7}
              >
                <View style={styles.aiSuggestionIcon}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </View>
                <View style={styles.aiSuggestionContent}>
                  <Text style={styles.aiSuggestionTitle}>
                    AI podpowiedź: {getCategoryById(aiSuggestion.categoryId)?.name}
                  </Text>
                  <Text style={styles.aiSuggestionConfidence}>
                    Pewność: {
                      aiSuggestion.confidence === 'high' ? 'wysoka 🎯' :
                      aiSuggestion.confidence === 'medium' ? 'średnia 👍' :
                      'niska 🤔'
                    }
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Receipt Photo */}
          <View style={styles.section}>
            <Text style={styles.label}>Zdjęcie paragonu</Text>
            <ReceiptPicker uri={receiptUri} onChange={setReceiptUri} />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>{pl.add.date}</Text>
            <TouchableOpacity
              style={styles.dateContainer}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.dateText}>{format(date, 'dd.MM.yyyy')}</Text>
              <Text style={styles.dateDayName}>
                {format(date, 'EEEE', { locale: dateFnsPl })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: TABS.find(t => t.key === activeTab)?.color },
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? pl.common.saving : saveButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
              <Text style={styles.calendarTitle}>{pl.add.selectDate}</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={format(date, 'yyyy-MM-dd')}
              onDayPress={handleDateSelect}
              markedDates={{
                [format(date, 'yyyy-MM-dd')]: {
                  selected: true,
                  selectedColor: colors.primary,
                },
              }}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.border,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textMonthFontWeight: '700',
                textMonthFontSize: 18,
              }}
            />

            {/* Quick date buttons */}
            <View style={styles.quickDates}>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  setDate(new Date());
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.quickDateText}>{pl.common.today}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDate(yesterday);
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.quickDateText}>{pl.common.yesterday}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  amountContainer: {
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  dateDayName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Calendar Modal styles
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
    width: '90%',
    maxWidth: 400,
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
  quickDates: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  // AI Suggestion styles
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  aiSuggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiSuggestionContent: {
    flex: 1,
  },
  aiSuggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  aiSuggestionConfidence: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
