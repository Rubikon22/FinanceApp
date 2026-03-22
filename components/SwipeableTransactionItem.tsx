import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

  const translateX = useSharedValue(0);

  const handleDelete = () => {
    translateX.value = withSpring(0);
    Alert.alert(
      pl.common.delete,
      'Czy na pewno chcesz usunac te transakcje?',
      [
        { text: pl.common.cancel, style: 'cancel' },
        {
          text: pl.common.delete,
          style: 'destructive',
          onPress: () => {
            translateX.value = withTiming(-500, { duration: 300 });
            onDelete?.();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    translateX.value = withSpring(0);
    onEdit?.();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const newValue = event.translationX;
      translateX.value = Math.max(Math.min(newValue, 0), -160);
    })
    .onEnd(() => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-160);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const editButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -80], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, -80], [0.5, 1], Extrapolate.CLAMP) }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-80, -160], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-80, -160], [0.5, 1], Extrapolate.CLAMP) }],
  }));

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
        <Animated.View style={[styles.actionButton, styles.editButton, editButtonStyle]}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionTouchable}>
            <Ionicons name="pencil" size={22} color={colors.white} />
            <Text style={styles.actionText}>{pl.common.edit}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.actionButton, styles.deleteButton, deleteButtonStyle]}>
          <TouchableOpacity onPress={handleDelete} style={styles.actionTouchable}>
            <Ionicons name="trash" size={22} color={colors.white} />
            <Text style={styles.actionText}>{pl.common.delete}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Main content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.itemContainer, animatedStyle]}>
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
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
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
});
