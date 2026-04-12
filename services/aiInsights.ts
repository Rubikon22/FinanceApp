/**
 * AI Service for smart financial insights and recommendations
 * Analyzes spending patterns and provides personalized suggestions
 */

import { Transaction } from '@/types';
import { getCategoryById } from '@/constants/categories';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface SmartInsight {
  id: string;
  type: 'warning' | 'tip' | 'success' | 'info';
  category: string;
  title: string;
  message: string;
  amount?: number;
  icon: string;
  priority: number; // 1-5, higher is more important
}

/**
 * Analyze spending patterns and generate insights
 */
export function generateSmartInsights(transactions: Transaction[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Filter transactions by period
  const currentMonthTx = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= currentMonthStart && date <= currentMonthEnd && t.type === 'expense';
  });

  const lastMonthTx = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= lastMonthStart && date <= lastMonthEnd && t.type === 'expense';
  });

  // Analyze by category
  const categorySpending = new Map<string, number>();
  const categoryCount = new Map<string, number>();
  const lastMonthCategorySpending = new Map<string, number>();

  currentMonthTx.forEach(t => {
    const current = categorySpending.get(t.categoryId) || 0;
    const count = categoryCount.get(t.categoryId) || 0;
    categorySpending.set(t.categoryId, current + t.amount);
    categoryCount.set(t.categoryId, count + 1);
  });

  lastMonthTx.forEach(t => {
    const current = lastMonthCategorySpending.get(t.categoryId) || 0;
    lastMonthCategorySpending.set(t.categoryId, current + t.amount);
  });

  // 1. High spending in specific category
  categorySpending.forEach((amount, categoryId) => {
    const category = getCategoryById(categoryId);
    if (!category) return;

    const lastMonthAmount = lastMonthCategorySpending.get(categoryId) || 0;
    const increase = lastMonthAmount > 0 ? ((amount - lastMonthAmount) / lastMonthAmount) * 100 : 0;

    // Warning: Significant increase
    if (increase > 50 && amount > 200) {
      insights.push({
        id: `high-increase-${categoryId}`,
        type: 'warning',
        category: categoryId,
        title: `Wzrost wydatkow: ${category.name}`,
        message: `Wydatki na ${category.name.toLowerCase()} wzrosły o ${increase.toFixed(0)}% (${amount.toFixed(2)} PLN). To więcej niż w zeszłym miesiącu!`,
        amount,
        icon: 'trending-up',
        priority: 5,
      });
    }

    // Tip: High absolute spending
    if (amount > 800) {
      const avgPerTransaction = amount / (categoryCount.get(categoryId) || 1);
      insights.push({
        id: `high-spending-${categoryId}`,
        type: 'tip',
        category: categoryId,
        title: `Wysoka suma: ${category.name}`,
        message: `Wydałeś już ${amount.toFixed(2)} PLN na ${category.name.toLowerCase()} w tym miesiącu. Średnio ${avgPerTransaction.toFixed(2)} PLN na transakcję. Rozważ ograniczenie wydatków.`,
        amount,
        icon: 'alert-circle',
        priority: 4,
      });
    }
  });

  // 2. Frequent small transactions (e.g., coffee, snacks)
  categoryCount.forEach((count, categoryId) => {
    const category = getCategoryById(categoryId);
    if (!category || categoryId !== 'food') return;

    const amount = categorySpending.get(categoryId) || 0;
    const avgPerTransaction = amount / count;

    if (count > 15 && avgPerTransaction < 30) {
      insights.push({
        id: 'frequent-small-food',
        type: 'tip',
        category: categoryId,
        title: 'Małe, częste wydatki',
        message: `Masz ${count} transakcji w kategorii ${category.name} (łącznie ${amount.toFixed(2)} PLN). Średnio ${avgPerTransaction.toFixed(2)} PLN. Małe wydatki szybko się sumują!`,
        amount,
        icon: 'cafe',
        priority: 3,
      });
    }
  });

  // 3. Success: Low spending
  const totalCurrentMonth = Array.from(categorySpending.values()).reduce((sum, val) => sum + val, 0);
  const totalLastMonth = Array.from(lastMonthCategorySpending.values()).reduce((sum, val) => sum + val, 0);

  if (totalLastMonth > 0 && totalCurrentMonth < totalLastMonth * 0.8) {
    const saved = totalLastMonth - totalCurrentMonth;
    insights.push({
      id: 'low-spending-success',
      type: 'success',
      category: 'general',
      title: 'Świetna praca! 🎉',
      message: `Wydajesz mniej niż w zeszłym miesiącu! Zaoszczędziłeś już ${saved.toFixed(2)} PLN. Tak trzymaj!`,
      amount: saved,
      icon: 'trophy',
      priority: 5,
    });
  }

  // 4. Subscription reminder
  const subscriptionKeywords = ['netflix', 'spotify', 'hbo', 'disney', 'prime', 'youtube', 'gym', 'siłownia'];
  const subscriptions = currentMonthTx.filter(t =>
    t.note && subscriptionKeywords.some(keyword =>
      t.note!.toLowerCase().includes(keyword)
    )
  );

  if (subscriptions.length > 3) {
    const total = subscriptions.reduce((sum, t) => sum + t.amount, 0);
    insights.push({
      id: 'multiple-subscriptions',
      type: 'info',
      category: 'bills',
      title: 'Wiele subskrypcji',
      message: `Masz ${subscriptions.length} subskrypcji o łącznej wartości ${total.toFixed(2)} PLN/miesiąc. Sprawdź czy wszystkie są potrzebne!`,
      amount: total,
      icon: 'card',
      priority: 3,
    });
  }

  // 5. Weekend spending pattern
  const weekendTx = currentMonthTx.filter(t => {
    const date = new Date(t.date);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });

  if (weekendTx.length > 0) {
    const weekendTotal = weekendTx.reduce((sum, t) => sum + t.amount, 0);
    const weekendPercentage = (weekendTotal / totalCurrentMonth) * 100;

    if (weekendPercentage > 40) {
      insights.push({
        id: 'weekend-spending',
        type: 'info',
        category: 'entertainment',
        title: 'Wydatki weekendowe',
        message: `${weekendPercentage.toFixed(0)}% Twoich wydatków przypada na weekendy (${weekendTotal.toFixed(2)} PLN). To może być dobry obszar do oszczędności!`,
        amount: weekendTotal,
        icon: 'calendar',
        priority: 2,
      });
    }
  }

  // 6. No spending in important categories
  const importantCategories = ['food', 'health', 'bills'];
  importantCategories.forEach(catId => {
    if (!categorySpending.has(catId) && currentMonthTx.length > 0) {
      const category = getCategoryById(catId);
      if (category) {
        insights.push({
          id: `no-spending-${catId}`,
          type: 'info',
          category: catId,
          title: 'Brak wydatków',
          message: `Nie odnotowano jeszcze wydatków w kategorii ${category.name} w tym miesiącu.`,
          icon: 'information-circle',
          priority: 1,
        });
      }
    }
  });

  // 7. Daily average insight
  const daysInMonth = currentMonthEnd.getDate();
  const currentDay = now.getDate();
  const dailyAverage = totalCurrentMonth / currentDay;

  if (currentDay > 7 && dailyAverage > 100) {
    const projectedTotal = dailyAverage * daysInMonth;
    insights.push({
      id: 'daily-average',
      type: 'info',
      category: 'general',
      title: 'Średnia dzienna',
      message: `Twoja średnia dzienna wynosi ${dailyAverage.toFixed(2)} PLN. Jeśli tak dalej pójdzie, wydasz ${projectedTotal.toFixed(2)} PLN w tym miesiącu.`,
      amount: dailyAverage,
      icon: 'stats-chart',
      priority: 2,
    });
  }

  // Sort by priority (highest first)
  insights.sort((a, b) => b.priority - a.priority);

  // Return top 5 insights
  return insights.slice(0, 5);
}

