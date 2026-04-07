import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { useTransactions } from '@/store/useTransactions';
import { format } from 'date-fns';

export default function CalendarScreen() {
  const router = useRouter();
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const transactions = useTransactions(state => state.transactions);
  const selectedDate = useTransactions(state => state.selectedDate);
  const setSelectedDate = useTransactions(state => state.setSelectedDate);

  const dailyStats = useMemo(() => {
    const stats: { [key: string]: { income: number; expense: number } } = {};
    transactions.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!stats[dateKey]) stats[dateKey] = { income: 0, expense: 0 };
      if (t.type === 'income') stats[dateKey].income += t.amount;
      else if (t.type === 'expense') stats[dateKey].expense += t.amount;
    });
    return stats;
  }, [transactions]);

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(new Date(day.dateString));
    router.back();
  };

  const clearAndClose = () => {
    setSelectedDate(null);
    router.back();
  };

  const renderDay = (date: DateData, state: string | undefined) => {
    const dateKey = date.dateString;
    const stats = dailyStats[dateKey];
    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateKey;
    const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
    const isDisabled = state === 'disabled';

    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          isSelected && { backgroundColor: colors.primary },
          isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
        ]}
        onPress={() => handleDateSelect(date)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.dayText,
            { color: colors.text },
            isSelected && { color: colors.white },
            isToday && !isSelected && { color: colors.primary },
            isDisabled && { color: colors.border },
          ]}
        >
          {date.day}
        </Text>
        {stats && (
          <View style={styles.dayStats}>
            {stats.income > 0 && (
              <Text style={[styles.dayStat, { color: colors.income }]} numberOfLines={1}>
                +{stats.income >= 1000 ? Math.floor(stats.income / 1000) + 'k' : stats.income.toFixed(0)}
              </Text>
            )}
            {stats.expense > 0 && (
              <Text style={[styles.dayStat, { color: colors.expense }]} numberOfLines={1}>
                -{stats.expense >= 1000 ? Math.floor(stats.expense / 1000) + 'k' : stats.expense.toFixed(0)}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Wybierz datę</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textMonthFontWeight: '700',
          textMonthFontSize: 18,
        }}
        dayComponent={({ date, state }: any) => renderDay(date as DateData, state)}
      />

      {selectedDate && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.surface }]}
          onPress={clearAndClose}
        >
          <Ionicons name="close-circle" size={18} color={colors.expense} />
          <Text style={{ color: colors.expense, fontSize: 15, fontWeight: '600' }}>
            Wyczyść filtr daty
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  calendar: {
    marginTop: 8,
  },
  dayContainer: {
    width: 48,
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayStats: {
    marginTop: 2,
    alignItems: 'center',
  },
  dayStat: {
    fontSize: 8,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
