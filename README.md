# FinanseApp — Aplikacja do zarządzania finansami osobistymi

Mobilna aplikacja (Android + iOS) do śledzenia wydatków, przychodów i budżetowania z wbudowanym asystentem AI opartym na Claude API (Anthropic).

## Technologie

- **React Native** + **Expo** (SDK 54)
- **TypeScript**
- **Expo Router** — nawigacja oparta na plikach
- **Zustand** — zarządzanie stanem (7 store'ów)
- **SQLite** (`expo-sqlite`) — lokalna baza danych (offline-first)
- **Supabase** — autoryzacja i synchronizacja z chmurą (PostgreSQL)
- **Claude API (Anthropic)** — chatbot AI z function calling
- **react-native-chart-kit** — wykresy
- **react-native-calendars** — kalendarz
- **@react-native-community/netinfo** — wykrywanie sieci

## Funkcje AI (Claude API)

### 1. Chatbot finansowy
- Rozmowa w języku naturalnym (polskim)
- Dodawanie transakcji bezpośrednio z czatu: _"Wydałem 50 zł na kawę"_
- Mechanizm **tool_use** (function calling) — Claude wywołuje akcje w aplikacji
- Historia konwersacji — model pamięta kontekst rozmowy
- Wymaga aktywnego połączenia z internetem i ważnego klucza API

### 2. Automatyczna kategoryzacja transakcji
- Sugestie kategorii na podstawie opisu transakcji
- 3 poziomy pewności: wysoka, średnia, niska
- Analiza słów kluczowych (>350 wzorców w 12 kategoriach)

### 3. Inteligentne porady finansowe
- Analiza wzorców wydatków w czasie rzeczywistym
- 7 typów spostrzeżeń (ostrzeżenia, porady, sukcesy)
- Porównanie z poprzednim miesiącem
- Wykrywanie częstych małych transakcji i wydatków weekendowych

## Główne funkcjonalności

### Transakcje
- Trzy typy: Wydatek, Przychód, Przelew między kontami
- Swipe w lewo → przyciski Edytuj / Usuń
- Zdjęcia paragonów (aparat lub galeria)
- Filtrowanie zaawansowane (typ, kategoria, kwota, data)
- Kalendarz z widokiem przychodów/wydatków per dzień

### Konta
- Wiele kont (gotówka, karta, oszczędności itd.)
- Automatyczna aktualizacja salda przy każdej transakcji
- Domyślne konta przy pierwszym uruchomieniu: Gotówka + Karta płatnicza

### Budżety
- Miesięczne limity wydatków per kategoria
- Pasek progresu z ostrzeżeniami przy przekroczeniu

### Płatności cykliczne
- Częstotliwości: dziennie, tygodniowo, miesięcznie, rocznie
- Automatyczne generowanie transakcji w terminie
- Widok i usuwanie z poziomu profilu

### Raporty i wykresy
- Wykres kołowy wydatków po kategoriach
- Porównanie miesięcy (bieżący vs poprzedni)
- Prognoza wydatków na koniec miesiąca
- Top 5 kategorii
- Dynamika bilansu (wykres liniowy)
- Statystyki za ostatnie 6 miesięcy

### Eksport danych
- CSV (kompatybilny z Excel, separator `;`, kodowanie UTF-8)
- JSON (pełny backup)

### Synchronizacja
- **Offline-first**: wszystkie operacje zapisują się lokalnie (SQLite)
- Automatyczna synchronizacja z Supabase po przywróceniu połączenia
- Wykrywanie stanu sieci przez NetInfo

### Motywy
- Tryb ciemny i jasny
- Dynamiczne kolory we wszystkich komponentach

## Struktura projektu

```
apka/
├── app/                              # Ekrany (Expo Router)
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Tab navigator
│   │   ├── index.tsx                 # Zapisy (lista transakcji + AI Insights)
│   │   ├── charts.tsx                # Wykresy
│   │   ├── reports.tsx               # Raporty + Analityka + Konta
│   │   ├── profile.tsx               # Profil, budżety, płatności cykliczne
│   │   └── add-placeholder.tsx       # Placeholder środkowej zakładki
│   ├── _layout.tsx                   # Root layout (Stack)
│   ├── add-transaction.tsx           # Modal dodawania transakcji
│   ├── edit-transaction.tsx          # Modal edycji transakcji
│   ├── calendar.tsx                  # Modal kalendarza (wybór dat)
│   ├── filters.tsx                   # Modal zaawansowanych filtrów
│   └── chatbot.tsx                   # Chatbot AI
├── components/
│   ├── TransactionForm.tsx           # Formularz z AI kategoryzacją
│   ├── TransactionList.tsx           # Lista z grupowaniem po datach
│   ├── SwipeableTransactionItem.tsx  # Element z gestem swipe
│   ├── SmartInsights.tsx             # Karty AI porad finansowych
│   ├── MonthComparison.tsx           # Porównanie miesięcy
│   ├── ExpenseForecast.tsx           # Prognoza wydatków
│   ├── TopCategories.tsx             # Top 5 kategorii
│   ├── BalanceTrend.tsx              # Dynamika bilansu (wykres liniowy)
│   ├── BudgetForm.tsx                # Formularz budżetu
│   ├── BudgetProgressCard.tsx        # Karta progresu budżetu
│   ├── RecurringTransactionForm.tsx  # Formularz płatności cyklicznych
│   ├── AccountForm.tsx               # Formularz konta
│   ├── AccountPicker.tsx             # Wybór konta
│   ├── CategoryPicker.tsx            # Wybór kategorii
│   ├── ReceiptPicker.tsx             # Zdjęcia paragonów
│   └── SyncStatusBanner.tsx          # Baner statusu synchronizacji
├── store/                            # Zustand stores (7 szt.)
│   ├── useTransactions.ts
│   ├── useAccounts.ts
│   ├── useBudgets.ts
│   ├── useRecurring.ts
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── useSyncStatus.ts
├── services/
│   ├── claudeApi.ts                  # HTTP wrapper dla Claude API
│   ├── secrets.ts                    # Klucze API (plik w .gitignore!)
│   ├── aiChatbot.ts                  # Logika chatbota (tool_use)
│   ├── aiCategorization.ts           # Auto-kategoryzacja transakcji
│   ├── aiInsights.ts                 # Inteligentne porady finansowe
│   ├── database.ts                   # Operacje SQLite
│   ├── supabase.ts                   # Klient Supabase
│   ├── sync.ts                       # Synchronizacja z chmurą
│   ├── export.ts                     # Eksport CSV/JSON
│   └── network.ts                    # Wykrywanie sieci
├── constants/
│   ├── categories.ts                 # Definicje kategorii
│   ├── colors.ts                     # Kolory (dark/light theme)
│   └── accountOptions.ts             # Opcje ikon i kolorów kont
├── types/
│   └── index.ts                      # Typy TypeScript
└── i18n/
    └── pl.ts                         # Tłumaczenia polskie
```

## Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie (z wyczyszczeniem cache)
npx expo start --clear
```

## Konfiguracja kluczy API

Utwórz plik `services/secrets.ts` (jest on w `.gitignore` — nie trafi do repozytorium):

```typescript
export const CLAUDE_API_KEY = 'sk-ant-...';       // console.anthropic.com
export const SUPABASE_URL = 'https://xxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

Klucz Claude API jest wymagany do działania chatbota — bez niego asystent AI nie będzie dostępny. Bez klucza Supabase synchronizacja z chmurą będzie niedostępna.

## Uruchamianie

- **Android / iOS**: Zeskanuj QR kod w aplikacji **Expo Go**
- **Web**: Naciśnij `w` w terminalu

> Wymagana wersja Expo Go obsługująca SDK 54.

## Architektura — kluczowe decyzje

| Decyzja | Rozwiązanie |
|---|---|
| Offline-first | SQLite jako główna baza, Supabase jako sync |
| Bezpieczny sync | `INSERT OR IGNORE` + mutex `isSyncing` |
| Motywy | `createStyles(colors)` pattern, `getThemeColors(theme)` |
| Kalendarze i filtry | Osobne ekrany expo-router zamiast Modal (Android fix) |
| Claude API w RN | Bezpośrednie wywołania HTTP (bez Node.js SDK) |
| Bezpieczeństwo kluczy | `services/secrets.ts` w `.gitignore` |

## Modele danych

### Transaction
```typescript
interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note?: string;
  date: string;
  receiptUri?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}
```

### Account
```typescript
interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  createdAt: string;
}
```

## Język interfejsu

Interfejs w całości po **polsku** (`i18n/pl.ts`).

## Licencja

MIT
