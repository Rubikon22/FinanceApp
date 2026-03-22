import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/constants/colors';
import { ThemeMode } from '@/types';
import { SmartInsight } from '@/services/aiInsights';

interface SmartInsightsProps {
  insights: SmartInsight[];
  theme: ThemeMode;
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({
  insights,
  theme,
}) => {
  const colors = getThemeColors(theme);

  if (insights.length === 0) {
    return null;
  }

  const getInsightColor = (type: SmartInsight['type']) => {
    switch (type) {
      case 'warning':
        return colors.expense;
      case 'success':
        return colors.income;
      case 'tip':
        return colors.primary;
      case 'info':
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  const getInsightBgColor = (type: SmartInsight['type']) => {
    switch (type) {
      case 'warning':
        return `${colors.expense}15`;
      case 'success':
        return `${colors.income}15`;
      case 'tip':
        return `${colors.primary}15`;
      case 'info':
        return `${colors.secondary}15`;
      default:
        return colors.card;
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={22} color={colors.primary} />
        <Text style={styles.title}>Inteligentne podpowiedzi</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {insights.map((insight) => (
          <View
            key={insight.id}
            style={[
              styles.insightCard,
              {
                backgroundColor: getInsightBgColor(insight.type),
                borderColor: `${getInsightColor(insight.type)}40`,
              },
            ]}
          >
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: getInsightColor(insight.type) },
              ]}
            >
              <Ionicons
                name={insight.icon as any}
                size={22}
                color={colors.white}
              />
            </View>

            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightMessage}>{insight.message}</Text>

              {insight.amount !== undefined && (
                <View style={styles.amountBadge}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: getInsightColor(insight.type) },
                    ]}
                  >
                    {insight.amount.toFixed(2)} PLN
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    insightCard: {
      width: 280,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
    },
    insightIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    insightContent: {
      flexShrink: 1,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    insightMessage: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    amountBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 4,
    },
    amountText: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
