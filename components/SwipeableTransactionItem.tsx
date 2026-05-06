import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { getThemeColors } from '@/constants/colors';
import { getCategoryById } from '@/constants/categories';
import { useAccounts } from '@/store/useAccounts';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SWIPE_THRESHOLD = 80;
const ACTIONS_WIDTH = 160;

export const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({
  transaction,
  onPress,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const getAccountById = useAccounts(state => state.getAccountById);

  const category = getCategoryById(transaction.categoryId);
  const account = getAccountById(transaction.accountId);
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(Math.min(gestureState.dx, 0), -ACTIONS_WIDTH);
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -ACTIONS_WIDTH,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = () => {
    closeSwipe();
    Alert.alert(
      pl.common.delete,
      'Czy na pewno chcesz usunac te transakcje?',
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.delete,
          style: 'destructive',
          onPress: () => {
            Animated.timing(translateX, {
              toValue: -500,
              duration: 250,
              useNativeDriver: true,
            }).start(() => onDelete?.());
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    closeSwipe();
    onEdit?.();
  };

  const editOpacity = translateX.interpolate({
    inputRange: [-ACTIONS_WIDTH, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const deleteOpacity = translateX.interpolate({
    inputRange: [-ACTIONS_WIDTH, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income': return colors.income;
      case 'expense': return colors.expense;
      case 'transfer': return colors.transfer;
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income': return '+';
      case 'expense': return '-';
      case 'transfer': return '';
    }
  };

  const getIcon = () => {
    if (transaction.type === 'transfer') return 'swap-horizontal';
    return category?.icon || 'ellipsis-horizontal';
  };

  const getSubtitle = () => {
    if (transaction.type === 'transfer' && toAccount) {
      return `${account?.name || ''} → ${toAccount.name}`;
    }
    return account?.name || '';
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Background actions */}
      <View style={styles.actionsContainer}>
        <Animated.View style={[styles.actionButton, styles.editButton, { opacity: editOpacity }]}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionTouchable}>
            <Ionicons name="pencil" size={22} color={colors.white} />
            <Text style={styles.actionText}>{pl.common.edit}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.actionButton, styles.deleteButton, { opacity: deleteOpacity }]}>
          <TouchableOpacity onPress={handleDelete} style={styles.actionTouchable}>
            <Ionicons name="trash" size={22} color={colors.white} />
            <Text style={styles.actionText}>{pl.common.delete}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Main content */}
      <Animated.View
        style={[styles.itemContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.transfer }]}>
            <Ionicons name={getIcon() as any} size={22} color={colors.white} />
          </View>

          <View style={styles.textContent}>
            <Text style={styles.category}>
              {transaction.type === 'transfer' ? pl.transaction.transfer : category?.name || ''}
            </Text>
            <Text style={styles.account}>{getSubtitle()}</Text>
            {transaction.note && (
              <Text style={styles.note} numberOfLines={1}>{transaction.note}</Text>
            )}
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: getAmountColor() }]}>
              {getAmountPrefix()}{transaction.amount.toFixed(2)} {pl.common.currency}
            </Text>
            {transaction.receiptUri && (
              <Ionicons name="receipt-outline" size={13} color={colors.textSecondary} style={styles.receiptIcon} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  container: {
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 12,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.expense,
  },
  actionText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  itemContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  account: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  receiptIcon: {
    marginTop: 4,
  },
});
