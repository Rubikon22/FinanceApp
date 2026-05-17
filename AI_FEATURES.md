# Funkcje AI — dokumentacja techniczna

Aplikacja wykorzystuje dwa podejścia do sztucznej inteligencji:
1. **Claude API (Anthropic)** — chatbot z rozumieniem języka naturalnego i function calling
2. **Lokalne przetwarzanie** — kategoryzacja i porady finansowe (działa offline)

---

## 1. Chatbot finansowy (Claude API)

**Plik:** `services/aiChatbot.ts`, `services/claudeApi.ts`, `app/chatbot.tsx`

### Jak to działa

Chatbot wysyła zapytanie do Claude API (model `claude-sonnet-4-20250514`) przez HTTP. Razem z wiadomością użytkownika przekazywane są:
- **System prompt** z kontekstem finansowym (saldo kont, ostatnie transakcje)
- **Historia rozmowy** — model pamięta poprzednie wiadomości
- **Definicja narzędzia** `add_transaction` — Claude może wywołać ją aby dodać transakcję

### Mechanizm tool_use (function calling)

```
Użytkownik: "Wydałem 50 zł na kawę"
     ↓
Claude API → zwraca tool_use: add_transaction({ amount: 50, categoryId: "food", note: "kawa" })
     ↓
App wywołuje addTransaction() w Zustand store
     ↓
Claude API → zwraca końcową odpowiedź: "Dodałem wydatek 50 zł na kawę ✓"
```

### Obsługiwane polecenia

- Dodawanie transakcji: _"Wydałem 120 zł na zakupy"_
- Pytania o bilans: _"Ile mam na koncie?"_
- Analiza wydatków: _"Ile wydałem na jedzenie w tym miesiącu?"_
- Porady finansowe: _"Jak mogę oszczędzać?"_

### Tryb fallback (offline)

Gdy Claude API jest niedostępne (brak internetu lub brak klucza), chatbot przechodzi na lokalne przetwarzanie z rozpoznawaniem intentów przez słowa kluczowe.

### Konfiguracja

Klucz API przechowywany w `services/secrets.ts` (plik w `.gitignore`):
```typescript
export const CLAUDE_API_KEY = 'sk-ant-...';
```

---

## 2. Automatyczna kategoryzacja transakcji

**Plik:** `services/aiCategorization.ts`  
**Integracja:** `components/TransactionForm.tsx`

### Funkcjonalność

Podczas wpisywania notatki do transakcji, system analizuje tekst i sugeruje kategorię:

| Notatka | Kategoria | Pewność |
|---|---|---|
| "McDonald's" | Jedzenie | Wysoka 🎯 |
| "Uber" | Transport | Wysoka 🎯 |
| "Netflix" | Rozrywka | Wysoka 🎯 |
| "Apteka" | Zdrowie | Wysoka 🎯 |
| "Zakupy" | Zakupy | Średnia 👍 |

### Poziomy pewności

- **Wysoka** (wynik ≥ 70): Dokładne dopasowanie słów kluczowych
- **Średnia** (wynik 50–69): Prawdopodobne dopasowanie
- **Niska** (wynik 30–49): Możliwe dopasowanie

### Jak to działa

```typescript
getCategorySuggestion(note, transactionType)
// zwraca: { categoryId: 'food', confidence: 'high' }
```

System oblicza wynik punktowy dla każdej kategorii na podstawie dopasowania słów kluczowych, a następnie zwraca kategorię z najwyższym wynikiem (jeśli przekracza próg 30 pkt).

Działa w **100% offline** — nie wymaga połączenia z internetem.

---

## 3. Inteligentne porady finansowe

**Plik:** `services/aiInsights.ts`  
**Integracja:** `components/SmartInsights.tsx`, `app/(tabs)/index.tsx`

### Typy spostrzeżeń

| Typ | Przykład |
|---|---|
| ⚠️ Ostrzeżenie | Wydatki na jedzenie wzrosły o 60% vs poprzedni miesiąc |
| 💡 Porada | Masz 18 małych transakcji w kategorii Jedzenie |
| 🎉 Sukces | Wydajesz mniej niż w zeszłym miesiącu! Zaoszczędziłeś 340 zł |
| ℹ️ Info | 45% wydatków przypada na weekendy |
| 📊 Statystyka | Średnia dzienna: 87 zł. Prognoza na miesiąc: 2 697 zł |

### Jak to działa

```typescript
generateSmartInsights(transactions: Transaction[]): SmartInsight[]
```

Funkcja analizuje transakcje bieżącego miesiąca i poprzedniego:
1. Porównuje wydatki per kategoria (wzrost > 50% → ostrzeżenie)
2. Wykrywa częste małe transakcje (> 15 w kategorii jedzenie)
3. Porównuje całkowite wydatki z poprzednim miesiącem
4. Analizuje wzorce weekendowe (> 40% wydatków)
5. Sprawdza subskrypcje (słowa kluczowe: netflix, spotify, gym...)
6. Oblicza prognozę na koniec miesiąca

Zwraca maksymalnie **5 spostrzeżeń** posortowanych według priorytetu.

Działa w **100% offline** — nie wymaga połączenia z internetem.
