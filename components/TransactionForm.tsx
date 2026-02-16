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
import { Colors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { TransactionType, Category, Account } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { CategoryGrid } from '@/components/CategoryPicker';
import { AccountPicker } from '@/components/AccountPicker';
import { format } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';
import { getCategorySuggestion } from '@/services/aiCategorization';
import { getCategoryById } from '@/constants/categories';

type TabType = 'expense' | 'income' | 'transfer';

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note?: string;
  date: string;
}

export interface TransactionFormInitialValues {
  type: TabType;
  amount: string;
  category: Category | null;
  account: Account | null;
  toAccount: Account | null;
  note: string;
  date: Date;
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
};

const TABS: { key: TabType; label: string; color: string }[] = [
  { key: 'expense', label: pl.transaction.expense, color: Colors.expense },
  { key: 'income', label: pl.transaction.income, color: Colors.income },
  { key: 'transfer', label: pl.transaction.transfer, color: Colors.transfer },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  title,
  saveButtonText,
  accounts,
  initialValues = DEFAULT_INITIAL_VALUES,
  isSaving,
  onSave,
}) => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>(initialValues.type);
  const [amount, setAmount] = useState(initialValues.amount);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(initialValues.category);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(initialValues.account);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(initialValues.toAccount);
  const [note, setNote] = useState(initialValues.note);
  const [date, setDate] = useState(initialValues.date);
  const [showCalendar, setShowCalendar] = useState(false);
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
        setAiSuggestion(suggestion);
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
        setAiSuggestion(suggestion);
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
      });
    } catch (error) {
      Alert.alert(pl.errors.errorTitle, pl.errors.saveFailed);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text} />
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
                placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
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
                  <Ionicons name="sparkles" size={16} color={Colors.primary} />
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
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>{pl.add.date}</Text>
            <TouchableOpacity
              style={styles.dateContainer}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>{format(date, 'dd.MM.yyyy')}</Text>
              <Text style={styles.dateDayName}>
                {format(date, 'EEEE', { locale: dateFnsPl })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
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
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={format(date, 'yyyy-MM-dd')}
              onDayPress={handleDateSelect}
              markedDates={{
                [format(date, 'yyyy-MM-dd')]: {
                  selected: true,
                  selectedColor: Colors.primary,
                },
              }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.border,
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
    color: Colors.text,
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
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
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  amountContainer: {
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  dateDayName: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.white,
  },
  // Calendar Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: Colors.surface,
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
    color: Colors.text,
  },
  quickDates: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // AI Suggestion styles
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  aiSuggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
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
    color: Colors.text,
    marginBottom: 2,
  },
  aiSuggestionConfidence: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
