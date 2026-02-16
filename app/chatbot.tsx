import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { useTransactions } from '@/store/useTransactions';
import { useAccounts } from '@/store/useAccounts';
import { ChatMessage, processQuery, getQuickReplies } from '@/services/aiChatbot';
import { format } from 'date-fns';

export default function ChatbotScreen() {
  const router = useRouter();
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const transactions = useTransactions(state => state.transactions);
  const accounts = useAccounts(state => state.accounts);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Cześć! 👋 Jestem Twoim asystentem finansowym.\n\nMogę pomóc Ci:\n• Dodać nową transakcję\n• Sprawdzić bilans\n• Pokazać wydatki\n• Wygenerować podsumowanie\n\nZadaj mi pytanie!',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const quickReplies = getQuickReplies();

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await processQuery(
        userMessage.content,
        transactions,
        accounts.map(a => ({ id: a.name, balance: a.balance }))
      );

      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    setInputText(reply);
  };

  const handleAction = (action: ChatMessage['action']) => {
    if (!action) return;

    switch (action.type) {
      case 'add_transaction':
        router.push('/add-transaction');
        break;
      case 'show_balance':
        router.push('/(tabs)/reports');
        break;
      case 'show_stats':
        router.push('/(tabs)/reports');
        break;
      case 'show_category_spending':
        router.push('/(tabs)/charts');
        break;
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50).duration(300)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={18} color={colors.white} />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface },
            { maxWidth: '75%' },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? colors.white : colors.text },
            ]}
          >
            {item.content}
          </Text>

          {item.action && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
              onPress={() => handleAction(item.action)}
            >
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {item.action.type === 'add_transaction' && 'Dodaj transakcję'}
                {item.action.type === 'show_balance' && 'Pokaż bilans'}
                {item.action.type === 'show_stats' && 'Zobacz raporty'}
                {item.action.type === 'show_category_spending' && 'Zobacz wykresy'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.timestamp, { color: isUser ? colors.white + '80' : colors.textSecondary }]}>
            {format(item.timestamp, 'HH:mm')}
          </Text>
        </View>

        {isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="person" size={18} color={colors.white} />
          </View>
        )}
      </Animated.View>
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatarContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={20} color={colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Asystent AI</Text>
            <Text style={styles.headerSubtitle}>Zawsze online</Text>
          </View>
        </View>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Quick Replies */}
        {!isProcessing && messages.length <= 2 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.quickRepliesContainer}>
            <Text style={styles.quickRepliesTitle}>Popularne pytania:</Text>
            <View style={styles.quickReplies}>
              {quickReplies.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickReplyButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleQuickReply(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Napisz wiadomość..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() ? colors.primary : colors.card },
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? colors.white : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
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
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerAvatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.income,
      marginTop: 2,
    },
    messagesList: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 16,
    },
    messageContainer: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-end',
    },
    userMessageContainer: {
      justifyContent: 'flex-end',
    },
    assistantMessageContainer: {
      justifyContent: 'flex-start',
    },
    avatarContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageBubble: {
      borderRadius: 16,
      padding: 12,
      gap: 8,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
    },
    timestamp: {
      fontSize: 11,
      marginTop: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 4,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    quickRepliesContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    quickRepliesTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    quickReplies: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    quickReplyButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    quickReplyText: {
      fontSize: 13,
      color: colors.text,
    },
    inputContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 12,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      maxHeight: 100,
      paddingVertical: 8,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
