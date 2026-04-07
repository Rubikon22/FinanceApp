/**
 * AI Chatbot Service — powered by Claude API
 * Supports: natural language understanding, conversation history,
 * direct transaction creation via tool_use
 */

import { Transaction, TransactionType } from '@/types';
import { ALL_CATEGORIES, getCategoryById } from '@/constants/categories';
import { callClaude, isApiKeySet, ClaudeMessage, ClaudeContentBlock, ClaudeTool } from './claudeApi';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, format } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';

// ── Public types ───────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'add_transaction' | 'show_balance' | 'show_stats' | 'show_category_spending' | 'transaction_added';
  data?: any;
}

// ── Tools exposed to Claude ────────────────────────────────────

const TOOLS: ClaudeTool[] = [
  {
    name: 'add_transaction',
    description:
      'Dodaje nową transakcję (wydatek lub przychód) bezpośrednio do systemu. ' +
      'Użyj gdy użytkownik prosi o dodanie/zapisanie transakcji.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['expense', 'income'],
          description: 'Typ transakcji',
        },
        amount: {
          type: 'number',
          description: 'Kwota w PLN (zawsze dodatnia)',
        },
        categoryId: {
          type: 'string',
          enum: ALL_CATEGORIES.map(c => c.id),
          description:
            'ID kategorii. Dostępne: ' +
            ALL_CATEGORIES.map(c => `${c.id} (${c.name})`).join(', '),
        },
        note: {
          type: 'string',
          description: 'Opcjonalny opis transakcji',
        },
      },
      required: ['type', 'amount', 'categoryId'],
    },
  },
];

// ── System prompt builder ──────────────────────────────────────

function buildSystemPrompt(
  transactions: Transaction[],
  accounts: { name: string; balance: number }[],
): string {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalIncome = monthTx
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Top 5 expense categories this month
  const catMap = new Map<string, number>();
  monthTx
    .filter(t => t.type === 'expense')
    .forEach(t => catMap.set(t.categoryId, (catMap.get(t.categoryId) || 0) + t.amount));
  const topCats = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, amt]) => `${getCategoryById(id)?.name || id}: ${amt.toFixed(2)} PLN`)
    .join(', ');

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const accountsList = accounts.map(a => `${a.name}: ${a.balance.toFixed(2)} PLN`).join(', ');

  return `Jesteś asystentem finansowym w polskiej aplikacji mobilnej do zarządzania finansami osobistymi.

AKTUALNA DATA: ${format(now, 'd MMMM yyyy', { locale: dateFnsPl })}

KONTA UŻYTKOWNIKA: ${accountsList}
ŁĄCZNE SALDO: ${totalBalance.toFixed(2)} PLN

PODSUMOWANIE BIEŻĄCEGO MIESIĄCA (${format(now, 'LLLL yyyy', { locale: dateFnsPl })}):
- Przychody: +${totalIncome.toFixed(2)} PLN
- Wydatki: -${totalExpenses.toFixed(2)} PLN
- Bilans: ${(totalIncome - totalExpenses).toFixed(2)} PLN
- Liczba transakcji: ${monthTx.length}
- Top kategorie wydatków: ${topCats || 'brak'}

DOSTĘPNE KATEGORIE WYDATKÓW: ${ALL_CATEGORIES.filter(c => c.type === 'expense').map(c => `${c.id} (${c.name})`).join(', ')}
DOSTĘPNE KATEGORIE PRZYCHODÓW: ${ALL_CATEGORIES.filter(c => c.type === 'income').map(c => `${c.id} (${c.name})`).join(', ')}

ZASADY:
- Odpowiadaj ZAWSZE po polsku
- Bądź zwięzły i konkretny
- Gdy użytkownik prosi o dodanie transakcji, użyj narzędzia add_transaction — NIE proś go o przejście do formularza
- Domyślny typ to 'expense', chyba że użytkownik wyraźnie mówi o przychodzie
- Domyślne konto to pierwsze konto użytkownika
- Możesz analizować wydatki, doradzać, odpowiadać na pytania o finanse
- Formatuj kwoty z dokładnością do 2 miejsc po przecinku i dodawaj "PLN"
- Dla danych których nie masz, odpowiedz że nie masz tych informacji

DANE HISTORYCZNE (ostatnie 50 transakcji):
${transactions
  .slice(0, 50)
  .map(t => {
    const cat = getCategoryById(t.categoryId);
    return `${t.date} | ${t.type} | ${t.amount.toFixed(2)} PLN | ${cat?.name || t.categoryId}${t.note ? ' | ' + t.note : ''}`;
  })
  .join('\n')}`;
}

// ── Conversation history → Claude messages format ──────────────

function chatHistoryToClaudeMessages(history: ChatMessage[]): ClaudeMessage[] {
  return history
    .filter(m => m.id !== 'welcome') // skip the static welcome message
    .map(m => ({
      role: m.role,
      content: m.content,
    }));
}

// ── Main entry point ───────────────────────────────────────────

export interface ProcessQueryResult {
  reply: ChatMessage;
  /** If the assistant created a transaction via tool, its data is here */
  transactionToAdd?: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    note?: string;
  };
}

export async function processQuery(
  query: string,
  transactions: Transaction[],
  accounts: { name: string; balance: number }[],
  conversationHistory: ChatMessage[] = [],
): Promise<ProcessQueryResult> {
  // If no API key, fall back to simple local processing
  if (!isApiKeySet()) {
    return processQueryLocal(query, transactions, accounts);
  }

  const system = buildSystemPrompt(transactions, accounts);

  // Build Claude messages from conversation history + new user message
  const claudeMessages: ClaudeMessage[] = [
    ...chatHistoryToClaudeMessages(conversationHistory),
    { role: 'user', content: query },
  ];

  const messageId = `msg-${Date.now()}`;
  const timestamp = new Date();

  try {
    const response = await callClaude(claudeMessages, system, TOOLS);

    // Check if Claude wants to use a tool
    const toolUseBlock = response.content.find(
      (b): b is ClaudeContentBlock & { type: 'tool_use' } => b.type === 'tool_use',
    );

    if (toolUseBlock && toolUseBlock.name === 'add_transaction') {
      const input = toolUseBlock.input!;
      const category = getCategoryById(input.categoryId);

      // Send tool result back to Claude and get final text response
      const followUpMessages: ClaudeMessage[] = [
        ...claudeMessages,
        {
          role: 'assistant',
          content: response.content as any,
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id!,
              content: `Transakcja dodana pomyślnie: ${input.type === 'income' ? 'przychód' : 'wydatek'} ${input.amount.toFixed(2)} PLN, kategoria: ${category?.name || input.categoryId}${input.note ? ', opis: ' + input.note : ''}`,
            },
          ],
        },
      ];

      const finalResponse = await callClaude(followUpMessages, system, TOOLS);
      const textBlock = finalResponse.content.find(b => b.type === 'text');

      return {
        reply: {
          id: messageId,
          role: 'assistant',
          content: textBlock?.text || `Dodano ${input.type === 'income' ? 'przychód' : 'wydatek'}: ${input.amount.toFixed(2)} PLN (${category?.name || input.categoryId})`,
          timestamp,
          action: {
            type: 'transaction_added',
            data: input,
          },
        },
        transactionToAdd: {
          type: input.type as TransactionType,
          amount: input.amount,
          categoryId: input.categoryId,
          note: input.note,
        },
      };
    }

    // Regular text response
    const textBlock = response.content.find(b => b.type === 'text');

    return {
      reply: {
        id: messageId,
        role: 'assistant',
        content: textBlock?.text || 'Nie mogę odpowiedzieć na to pytanie.',
        timestamp,
      },
    };
  } catch (error) {
    console.error('Claude API error:', error);
    // Fall back to local processing on API error
    return processQueryLocal(query, transactions, accounts);
  }
}

// ── Fallback: local keyword-based processing (no API key) ──────

function processQueryLocal(
  query: string,
  transactions: Transaction[],
  accounts: { name: string; balance: number }[],
): ProcessQueryResult {
  const q = query.toLowerCase().trim();
  const messageId = `msg-${Date.now()}`;
  const timestamp = new Date();

  // Balance
  if (q.includes('bilans') || q.includes('saldo') || q.includes('ile mam')) {
    const total = accounts.reduce((s, a) => s + a.balance, 0);
    return {
      reply: {
        id: messageId,
        role: 'assistant',
        content:
          `Twój aktualny bilans to **${total.toFixed(2)} PLN**\n\n` +
          accounts.map(a => `• ${a.name}: ${a.balance.toFixed(2)} PLN`).join('\n'),
        timestamp,
        action: { type: 'show_balance' },
      },
    };
  }

  // Stats
  if (q.includes('statystyki') || q.includes('podsumowanie') || q.includes('raport')) {
    const now = new Date();
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);
    const mTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= mStart && d <= mEnd;
    });
    const income = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      reply: {
        id: messageId,
        role: 'assistant',
        content:
          `Podsumowanie ${format(now, 'LLLL yyyy', { locale: dateFnsPl })}:\n\n` +
          `Przychody: +${income.toFixed(2)} PLN\n` +
          `Wydatki: -${expenses.toFixed(2)} PLN\n` +
          `Bilans: ${(income - expenses).toFixed(2)} PLN`,
        timestamp,
        action: { type: 'show_stats' },
      },
    };
  }

  return {
    reply: {
      id: messageId,
      role: 'assistant',
      content:
        'Tryb offline — brak klucza API Claude.\n\n' +
        'Ustaw klucz API w services/claudeApi.ts aby odblokować pełne możliwości AI.\n\n' +
        'Dostępne komendy offline:\n' +
        '• "Pokaż bilans"\n' +
        '• "Podsumowanie miesiąca"',
      timestamp,
    },
  };
}

/**
 * Quick reply suggestions
 */
export function getQuickReplies(): string[] {
  return [
    'Pokaż bilans',
    'Ile wydałem na jedzenie?',
    'Dodaj wydatek 50 zł na taxi',
    'Podsumowanie miesiąca',
    'Porady jak oszczędzać',
  ];
}
