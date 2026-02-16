# Finanse - Aplikacja do zarzadzania finansami

Mobilna aplikacja (Android + iOS) do sledzenia wydatkow, przychodow i budzetowania.

## Technologie

- **React Native** + **Expo** (SDK 52)
- **TypeScript**
- **Expo Router** - nawigacja
- **Zustand** - zarzadzanie stanem
- **SQLite** - lokalna baza danych
- **Firebase** - autoryzacja i synchronizacja w chmurze
- **react-native-calendars** - kalendarz
- **react-native-chart-kit** - wykresy
- **AI Features** - lokalna sztuczna inteligencja (offline)

## 🤖 AI Features (NOWOŚĆ!)

### 1. Automatyczna kategoryzacja transakcji 🏷️
- AI rozpoznaje kategorię po opisie (np. "McDonald's" → Jedzenie)
- Ponad 300 słów kluczowych w 11 kategoriach
- 3 poziomy pewności: wysoka 🎯, średnia 👍, niska 🤔
- Sugestie w czasie rzeczywistym podczas pisania notatki

### 2. Inteligentne podpowiedzi oszczędnościowe 💡
- Analiza wzorców wydatków
- Wykrywanie nietypowych trendów
- Personalizowane rekomendacje
- 7 typów insightów (ostrzeżenia, porady, sukcesy)
- Przewijane karty z najważniejszymi radami

### 3. Chatbot finansowy 🤖
- Naturalne polecenia po polsku
- Obsługa 4 głównych intentów:
  - Dodawanie transakcji: "Dodaj wydatek 50 zł na taxi"
  - Sprawdzanie bilansu: "Pokaż mój bilans"
  - Wydatki: "Ile wydałem na jedzenie?"
  - Podsumowania: "Raport tego miesiąca"
- Quick replies dla popularnych zapytań
- Integracja z akcjami (dodaj transakcję, zobacz raporty)

**✅ Wszystkie funkcje AI działają 100% offline - pełna prywatność!**

Zobacz szczegóły: [AI_FEATURES.md](./AI_FEATURES.md)

## Funkcjonalnosci

### Zapisy (Glowna)
- **🤖 Inteligentne podpowiedzi AI** - przewijane karty z rekomendacjami oszczędnościowymi
- Lista transakcji pogrupowana po datach
- Karta podsumowania miesiaca (przychody, wydatki, bilans)
- Przelaczanie miedzy miesiacami
- Kalendarz z podgledem dochodow/wydatkow na kazdy dzien
- Filtrowanie po dacie i zaawansowane filtry
- Podglad szczegolow transakcji
- Edycja i usuwanie transakcji (swipe to delete)

### Dodawanie transakcji
- Trzy typy: Wydatek, Przychod, Przelew
- **🤖 AI auto-kategoryzacja** - sugestie kategorii na podstawie notatki
- Wybor kategorii (8 kategorii wydatkow, 4 kategorii przychodow)
- Wybor konta
- Notatka
- Wybor daty z kalendarza
- Szybkie przyciski "Dzisiaj" i "Wczoraj"

### Wykresy
- Wykres kolowy wydatkow po kategoriach
- Wybor zakresu dat (od - do)
- Podsumowanie przychodow i wydatkow
- Legenda z procentami

### Raporty
- **Analityka** - zaawansowana analiza finansow:
  - 📊 Porownanie miesiecy (biezacy vs poprzedni)
  - 📈 Prognoza wydatkow na podstawie historii
  - 🏆 Top 5 kategorii wydatkow
  - 📉 Dynamika bilansu (wykres liniowy)
  - 📅 Statystyki miesieczne za ostatnie 6 miesiecy
- **Konta** - lista kont z saldami, aktywa netto
- Automatyczne tworzenie kont: "Gotówka" i "Karta płatnicza"
- Dodawanie, edycja i usuwanie kont

### Profil
- **🤖 Asystent AI** - chatbot finansowy z naturalnym językiem
- Budżety - planowanie budżetu na kategorie
- Transakcje cykliczne - automatyczne powtarzające się płatności
- Logowanie/wylogowanie
- Ustawienia (tryb ciemny, jezyk)
- Synchronizacja z chmura
- Eksport danych (JSON, CSV)

## Struktura projektu

```
apka/
├── app/                          # Ekrany (Expo Router)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Zapisy + AI Insights
│   │   ├── charts.tsx            # Wykresy
│   │   ├── reports.tsx           # Raporty + Analityka AI
│   │   └── profile.tsx           # Profil
│   ├── chatbot.tsx               # 🤖 AI Chatbot
│   ├── add-transaction.tsx       # Dodawanie transakcji + AI
│   ├── edit-transaction.tsx      # Edycja transakcji
│   └── _layout.tsx               # Root layout
├── components/
│   ├── TransactionForm.tsx       # Forma z AI kategoryzacją
│   ├── SmartInsights.tsx         # 🤖 AI Insights karty
│   ├── MonthComparison.tsx       # Porównanie miesięcy
│   ├── ExpenseForecast.tsx       # Prognoza wydatków
│   ├── TopCategories.tsx         # Top 5 kategorii
│   ├── BalanceTrend.tsx          # Dynamika bilansu
│   ├── TransactionList.tsx       # Lista transakcji
│   ├── BudgetForm.tsx            # Formularz budżetu
│   └── RecurringTransactionForm.tsx # Transakcje cykliczne
├── store/
│   ├── useTransactions.ts        # Stan transakcji
│   ├── useAccounts.ts            # Stan kont (z domyślnymi)
│   ├── useBudgets.ts             # Stan budżetów
│   ├── useRecurring.ts           # Stan transakcji cyklicznych
│   ├── useAuth.ts                # Stan autoryzacji
│   └── useTheme.ts               # Stan motywu (dark/light)
├── services/
│   ├── aiCategorization.ts       # 🤖 AI Auto-kategoryzacja
│   ├── aiInsights.ts             # 🤖 AI Smart Insights
│   ├── aiChatbot.ts              # 🤖 AI Chatbot NLP
│   ├── database.ts               # Operacje SQLite
│   ├── firebase.ts               # Konfiguracja Firebase
│   ├── export.ts                 # Eksport danych
│   └── sync.ts                   # Synchronizacja
├── constants/
│   ├── categories.ts             # Kategorie
│   └── colors.ts                 # Kolory (dark/light)
├── types/
│   └── index.ts                  # Typy TypeScript
└── i18n/
    └── pl.ts                     # Tłumaczenia polskie
```

## Kategorie

### Wydatki
- Jedzenie
- Transport
- Zakupy
- Rozrywka
- Zdrowie
- Rachunki
- Edukacja
- Inne

### Przychody
- Wynagrodzenie
- Prezent
- Inwestycje
- Inne

## Instalacja

```bash
# Instalacja zaleznosci
npm install

# Uruchomienie
npx expo start

# Lub z wyczyszczeniem cache
npx expo start --clear
```

## Uruchamianie

- **Android**: Nacisnij `a` w terminalu lub zeskanuj QR kod w Expo Go
- **iOS**: Nacisnij `i` w terminalu lub zeskanuj QR kod w Expo Go
- **Web**: Nacisnij `w` w terminalu

## Firebase (opcjonalnie)

Aby wlaczyc synchronizacje w chmurze:

1. Utworz projekt w [Firebase Console](https://console.firebase.google.com/)
2. Wlacz Authentication (Email/Password)
3. Utworz baze Firestore
4. Skopiuj konfiguracje do `services/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Pierwsze uruchomienie

Przy pierwszym uruchomieniu aplikacji automatycznie tworzone są:
- **2 konta domyślne**:
  - 💵 Gotówka (cash, kolor zielony)
  - 💳 Karta płatnicza (card, kolor fioletowy)
- Wszystkie kategorie wydatków i przychodów

Możesz dodać własne konta lub używać domyślnych.

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

## Jezyk interfejsu

Aplikacja jest w jezyku **polskim**.

## Licencja

MIT
