import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '@/types';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';

interface AccountPickerProps {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (account: Account) => void;
  label?: string;
}

export const AccountPicker: React.FC<AccountPickerProps> = ({
  accounts,
  selectedId,
  onSelect,
  label,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {accounts.map((account) => {
          const isSelected = selectedId === account.id;
          return (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountItem,
                isSelected && styles.accountItemSelected,
                isSelected && { borderColor: account.color },
              ]}
              onPress={() => onSelect(account)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected ? account.color : colors.card },
                ]}
              >
                <Ionicons
                  name={account.icon as any}
                  size={20}
                  color={isSelected ? colors.white : account.color}
                />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={[styles.accountBalance, { color: account.balance >= 0 ? colors.income : colors.expense }]}>
                  {account.balance.toFixed(2)} {pl.common.currency}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  container: {
    paddingHorizontal: 4,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 140,
  },
  accountItemSelected: {
    backgroundColor: colors.card,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  accountBalance: {
    fontSize: 12,
    marginTop: 2,
  },
});
