import React, { useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  Layout,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { Transaction } from '@/types';
import { Colors, getThemeColors } from '@/constants/colors';
import { SwipeableTransactionItem } from './SwipeableTransactionItem';
import { useTheme } from '@/store/useTheme';
import { useTransactions } from '@/store/useTransactions';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';
import { pl } from '@/i18n/pl';

interface TransactionListProps {
  transactions: Transaction[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onTransactionPress?: (transaction: Transaction) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

interface Section {
  title: string;
  data: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  refreshing = false,
  onRefresh,
  onTransactionPress,
  onEditTransaction,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const deleteTransaction = useTransactions(state => state.deleteTransaction);

  const groupTransactionsByDate = useCallback((): Section[] => {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach(transaction => {
      const dateKey = transaction.date.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, data]) => ({
        title: formatDateHeader(dateKey),
        data,
      }));
  }, [transactions]);

  const formatDateHeader = (dateKey: string): string => {
    const date = parseISO(dateKey);

    if (isToday(date)) {
      return pl.common.today;
    }
    if (isYesterday(date)) {
      return pl.common.yesterday;
    }

    return format(date, 'd MMMM yyyy', { locale: dateFnsPl });
  };

  const handleDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const sections = groupTransactionsByDate();
  const styles = createStyles(colors);

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View entering={FadeInRight.delay(200).duration(400)}>
          <Text style={styles.emptyText}>{pl.main.noTransactions}</Text>
          <Text style={styles.emptySubtext}>{pl.main.addFirst}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {sections.map((section, sectionIndex) => (
        <Animated.View
          key={section.title}
          entering={FadeInRight.delay(sectionIndex * 100).duration(400)}
          layout={Layout.springify()}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {section.data.map((item, itemIndex) => (
            <Animated.View
              key={item.id}
              entering={SlideInRight.delay(sectionIndex * 100 + itemIndex * 50).duration(400).springify()}
              exiting={SlideOutLeft.duration(300)}
              layout={Layout.springify()}
            >
              <SwipeableTransactionItem
                transaction={item}
                onPress={() => onTransactionPress?.(item)}
                onEdit={() => onEditTransaction?.(item)}
                onDelete={() => handleDelete(item.id)}
              />
            </Animated.View>
          ))}
        </Animated.View>
      ))}
    </Animated.ScrollView>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
