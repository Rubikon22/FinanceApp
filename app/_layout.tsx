import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { pl } from '@/i18n/pl';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { useAuth } from '@/store/useAuth';

export default function RootLayout() {
  const loadTransactions = useTransactions(state => state.loadTransactions);
  const loadAccounts = useAccounts(state => state.loadAccounts);
  const checkAuth = useAuth(state => state.checkAuth);

  useEffect(() => {
    const initApp = async () => {
      try {
        await Promise.all([
          loadTransactions(),
          loadAccounts(),
          checkAuth(),
        ]);
      } catch (error) {
        Alert.alert(pl.errors.errorTitle, pl.errors.generic);
      }
    };
    initApp();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="edit-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
