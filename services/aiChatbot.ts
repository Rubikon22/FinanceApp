/**
 * AI Chatbot Service for natural language financial queries
 * Handles text and voice commands for managing finances
 */

import { Transaction } from '@/types';
import { getCategoryById, ALL_CATEGORIES } from '@/constants/categories';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'add_transaction' | 'show_balance' | 'show_stats' | 'show_category_spending';
  data?: any;
}

/**
 * Parse user query and extract intent
 */
function parseQuery(query: string): {
  intent: string;
  entities: Record<string, any>;
} {
  const normalizedQuery = query.toLowerCase().trim();

  // Intent: Add transaction
  if (
    normalizedQuery.includes('dodaj') ||
    normalizedQuery.includes('zapisz') ||
    normalizedQuery.includes('wydatek') ||
    normalizedQuery.includes('wydalem') ||
    normalizedQuery.includes('wydałem') ||
    normalizedQuery.includes('zaplacil') ||
    normalizedQuery.includes('zapłaciłem')
  ) {
    return {
      intent: 'add_transaction',
      entities: extractTransactionEntities(normalizedQuery),
    };
  }

  // Intent: Show balance
  if (
    normalizedQuery.includes('bilans') ||
    normalizedQuery.includes('saldo') ||
    normalizedQuery.includes('balance') ||
    normalizedQuery.includes('ile mam')
  ) {
    return {
      intent: 'show_balance',
      entities: {},
    };
  }

  // Intent: Show category spending
  if (
    normalizedQuery.includes('wydatki') ||
    normalizedQuery.includes('wydat') ||
    normalizedQuery.includes('ile wyda') ||
    normalizedQuery.includes('ile potrat') ||
    normalizedQuery.includes('ile potraciłem')
  ) {
    return {
      intent: 'show_category_spending',
      entities: extractCategoryEntities(normalizedQuery),
    };
  }

  // Intent: Show stats
  if (
    normalizedQuery.includes('statystyki') ||
    normalizedQuery.includes('podsumowanie') ||
    normalizedQuery.includes('raport')
  ) {
    return {
      intent: 'show_stats',
      entities: extractTimeEntities(normalizedQuery),
    };
  }

  // Default: unknown
  return {
    intent: 'unknown',
    entities: {},
  };
}

/**
 * Extract transaction details from query
 */
function extractTransactionEntities(query: string): Record<string, any> {
  const entities: Record<string, any> = {};

  // Extract amount (patterns: "50 zł", "50 zlotych", "50 pln")
  const amountMatch = query.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:zł|złotych|pln|zlotych)?/);
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1].replace(',', '.'));
  }

  // Extract category keywords
  ALL_CATEGORIES.forEach(cat => {
    const catName = cat.name.toLowerCase();
    if (query.includes(catName)) {
      entities.category = cat.id;
    }
  });

  // Specific keywords for categories
  if (query.includes('taxi') || query.includes('taksi') || query.includes('uber') || query.includes('bolt')) {
    entities.category = 'transport';
  }
  if (query.includes('kawa') || query.includes('kawiarnia') || query.includes('restauracja')) {
    entities.category = 'food';
  }
  if (query.includes('netflix') || query.includes('spotify') || query.includes('kino')) {
    entities.category = 'entertainment';
  }

  return entities;
}

/**
 * Extract category from query
 */
function extractCategoryEntities(query: string): Record<string, any> {
  const entities: Record<string, any> = {};

  ALL_CATEGORIES.forEach(cat => {
    const catName = cat.name.toLowerCase();
    if (query.includes(catName)) {
      entities.category = cat.id;
    }
  });

  // Specific keywords
  if (query.includes('jedzenie') || query.includes('żywność') || query.includes('zywnosc')) {
    entities.category = 'food';
  }
  if (query.includes('transport') || query.includes('przejazd')) {
    entities.category = 'transport';
  }

  return entities;
}

/**
 * Extract time period from query
 */
function extractTimeEntities(query: string): Record<string, any> {
  const entities: Record<string, any> = {};

  if (query.includes('ten miesiąc') || query.includes('ten miesiac') || query.includes('w tym miesiacu')) {
    entities.period = 'current_month';
  } else if (query.includes('ostatni miesiąc') || query.includes('ostatni miesiac') || query.includes('zeszły')) {
    entities.period = 'last_month';
  } else if (query.includes('dzisiaj') || query.includes('dziś')) {
    entities.period = 'today';
  } else if (query.includes('tydzień') || query.includes('tydzien')) {
    entities.period = 'week';
  }

  return entities;
}

/**
 * Process user query and generate response
 */
export async function processQuery(
  query: string,
  transactions: Transaction[],
  accounts: { id: string; balance: number }[]
): Promise<ChatMessage> {
  const { intent, entities } = parseQuery(query);

  const messageId = `msg-${Date.now()}`;
  const timestamp = new Date();

  switch (intent) {
    case 'add_transaction':
      return handleAddTransaction(messageId, timestamp, entities);

    case 'show_balance':
      return handleShowBalance(messageId, timestamp, accounts);

    case 'show_category_spending':
      return handleShowCategorySpending(messageId, timestamp, entities, transactions);

    case 'show_stats':
      return handleShowStats(messageId, timestamp, entities, transactions);

    default:
      return {
        id: messageId,
        role: 'assistant',
        content: 'Przepraszam, nie rozumiem. Spróbuj zapytać:\n\n' +
          '• "Dodaj wydatek 50 zł na taxi"\n' +
          '• "Ile wydałem na jedzenie w tym miesiącu?"\n' +
          '• "Pokaz moj bilans"\n' +
          '• "Podsumowanie tego miesiąca"',
        timestamp,
      };
  }
}

function handleAddTransaction(
  id: string,
  timestamp: Date,
  entities: Record<string, any>
): ChatMessage {
  if (!entities.amount) {
    return {
      id,
      role: 'assistant',
      content: 'Nie wykryłem kwoty. Spróbuj np: "Dodaj wydatek 50 zł na taxi"',
      timestamp,
    };
  }

  const category = entities.category || 'other_expense';
  const categoryObj = getCategoryById(category);

  return {
    id,
    role: 'assistant',
    content: `Rozumiem! Chcesz dodać wydatek ${entities.amount.toFixed(2)} PLN w kategorii "${categoryObj?.name || 'Inne'}".\n\nKliknij przycisk poniżej, aby dodać tę transakcję.`,
    timestamp,
    action: {
      type: 'add_transaction',
      data: {
        amount: entities.amount,
        categoryId: category,
      },
    },
  };
}

function handleShowBalance(
  id: string,
  timestamp: Date,
  accounts: { id: string; balance: number }[]
): ChatMessage {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return {
    id,
    role: 'assistant',
    content: `Twój aktualny bilans to **${totalBalance.toFixed(2)} PLN**\n\n` +
      accounts.map(acc => `• ${acc.id}: ${acc.balance.toFixed(2)} PLN`).join('\n'),
    timestamp,
    action: {
      type: 'show_balance',
    },
  };
}

function handleShowCategorySpending(
  id: string,
  timestamp: Date,
  entities: Record<string, any>,
  transactions: Transaction[]
): ChatMessage {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTx = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd && t.type === 'expense';
  });

  if (entities.category) {
    const categoryTx = monthTx.filter(t => t.categoryId === entities.category);
    const total = categoryTx.reduce((sum, t) => sum + t.amount, 0);
    const category = getCategoryById(entities.category);

    return {
      id,
      role: 'assistant',
      content: `W tym miesiącu wydałeś **${total.toFixed(2)} PLN** na ${category?.name || 'tę kategorię'}.\n\n` +
        `Liczba transakcji: ${categoryTx.length}`,
      timestamp,
      action: {
        type: 'show_category_spending',
        data: { categoryId: entities.category },
      },
    };
  }

  // Show all categories
  const categoryMap = new Map<string, number>();
  monthTx.forEach(t => {
    const current = categoryMap.get(t.categoryId) || 0;
    categoryMap.set(t.categoryId, current + t.amount);
  });

  const sorted = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const content = sorted.map(([catId, amount]) => {
    const cat = getCategoryById(catId);
    return `• ${cat?.name || catId}: ${amount.toFixed(2)} PLN`;
  }).join('\n');

  return {
    id,
    role: 'assistant',
    content: `Twoje wydatki w tym miesiącu:\n\n${content}`,
    timestamp,
    action: {
      type: 'show_category_spending',
    },
  };
}

function handleShowStats(
  id: string,
  timestamp: Date,
  entities: Record<string, any>,
  transactions: Transaction[]
): ChatMessage {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTx = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const income = monthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  return {
    id,
    role: 'assistant',
    content: `📊 Podsumowanie ${format(now, 'LLLL yyyy', { locale: dateFnsPl })}:\n\n` +
      `💰 Przychody: +${income.toFixed(2)} PLN\n` +
      `💸 Wydatki: -${expenses.toFixed(2)} PLN\n` +
      `📈 Bilans: ${balance >= 0 ? '+' : ''}${balance.toFixed(2)} PLN`,
    timestamp,
    action: {
      type: 'show_stats',
    },
  };
}

/**
 * Generate quick reply suggestions
 */
export function getQuickReplies(): string[] {
  return [
    'Pokaz bilans',
    'Ile wydałem na jedzenie?',
    'Dodaj wydatek 50 zł',
    'Podsumowanie miesiąca',
    'Wydatki tego tygodnia',
  ];
}
