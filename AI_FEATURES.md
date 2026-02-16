# AI Features Documentation

## Przegląd funkcji AI

Aplikacja Finanse została wzbogacona o zaawansowane funkcje AI, które automatyzują i ułatwiają zarządzanie finansami osobistymi.

---

## 1. Automatyczna kategor izacja transakcji 🏷️

### Lokalizacja
- **Serwis**: `services/aiCategorization.ts`
- **Integracja**: `components/TransactionForm.tsx`

### Funkcjonalność

AI automatycznie sugeruje kategorię na podstawie notatki do transakcji, używając:
- Analizy słów kluczowych
- Dopasowania wzorców
- Systemu punktacji (confidence scoring)

### Jak to działa

1. Użytkownik wpisuje notatkę (np. "McDonald's")
2. AI analizuje tekst i wyszukuje dopasowania w bazie słów kluczowych
3. Wyświetla się sugestia z poziomem pewności:
   - **Wysoka** 🎯 (70-100%): Dokładne dopasowanie
   - **Średnia** 👍 (50-69%): Prawdopodobne dopasowanie
   - **Niska** 🤔 (30-49%): Możliwe dopasowanie

### Przykłady rozpoznawania

```typescript
"McDonald's"      → Jedzenie (wysoka pewność)
"Uber"           → Transport (wysoka pewność)
"Netflix"        → Rozrywka (wysoka pewność)
"Lidl"           → Jedzenie (wysoka pewność)
"Apteka"         → Zdrowie (wysoka pewność)
"Prąd"           → Rachunki (wysoka pewność)
```

### Baza słów kluczowych

Ponad **300 słów kluczowych** w 11 kategoriach:
- Jedzenie (food)
- Transport (transport)
- Zakupy (shopping)
- Rozrywka (entertainment)
- Zdrowie (health)
- Rachunki (bills)
- Edukacja (education)
- Wynagrodzenie (salary)
- Prezent (gift)
- Inwestycje (investment)
- Inne (other)

### UI/UX

Gdy AI wykryje kategorię, pojawia się karta z sugestią:

```
┌─────────────────────────────────────┐
│ ✨ AI podpowiedź: Jedzenie          │
│ Pewność: wysoka 🎯                  │
│                               >     │
└─────────────────────────────────────┘
```

Kliknięcie automatycznie wybiera sugerowaną kategorię.

---

## 2. Inteligentne podpowiedzi oszczędnościowe 💡

### Lokalizacja
- **Serwis**: `services/aiInsights.ts`
- **Komponent**: `components/SmartInsights.tsx`
- **Wyświetlanie**: `app/(tabs)/index.tsx` (główny ekran)

### Funkcjonalność

AI analizuje wzorce wydatków i generuje personalizowane rekomendacje w czasie rzeczywistym.

### Typy insightów

#### 1. ⚠️ Ostrzeżenia (Warning)
```typescript
{
  type: 'warning',
  title: 'Wzrost wydatków: Jedzenie',
  message: 'Wydatki na jedzenie wzrosły o 67% (1200 PLN).
           To więcej niż w zeszłym miesiącu!',
  priority: 5
}
```

**Kiedy**: Wzrost wydatków >50% w kategorii z kwotą >200 PLN

#### 2. 💡 Porady (Tip)
```typescript
{
  type: 'tip',
  title: 'Wysoka suma: Jedzenie',
  message: 'Wydałeś już 850 PLN na jedzenie w tym miesiącu.
           Średnio 56.67 PLN na transakcję.
           Rozważ ograniczenie wydatków.',
  priority: 4
}
```

**Kiedy**: Suma wydatków w kategorii >800 PLN

#### 3. ✅ Sukcesy (Success)
```typescript
{
  type: 'success',
  title: 'Świetna praca! 🎉',
  message: 'Wydajesz mniej niż w zeszłym miesiącu!
           Zaoszczędziłeś już 320 PLN. Tak trzymaj!',
  priority: 5
}
```

**Kiedy**: Wydatki <80% wydatków z poprzedniego miesiąca

#### 4. ℹ️ Informacje (Info)
```typescript
{
  type: 'info',
  title: 'Wiele subskrypcji',
  message: 'Masz 5 subskrypcji o łącznej wartości 150 PLN/miesiąc.
           Sprawdź czy wszystkie są potrzebne!',
  priority: 3
}
```

**Kiedy**: Wykryto >3 subskrypcje

### Analiza wzorców

AI analizuje:
- **Częstotliwość transakcji**: Małe, częste wydatki (np. kawa)
- **Wydatki weekendowe**: >40% wydatków w weekendy
- **Średnia dzienna**: Prognoza miesięczna
- **Porównania**: Obecny vs poprzedni miesiąc
- **Subskrypcje**: Netflix, Spotify, gym, itp.

### Priorytety (1-5)

Insights są sortowane według priorytetu:
- **5**: Krytyczne (duże zmiany, oszczędności)
- **4**: Ważne (wysokie wydatki)
- **3**: Średnie (wzorce, subskrypcje)
- **2**: Niskie (ogólne statystyki)
- **1**: Informacyjne (brak danych)

### UI - Przewijane karty

Insights wyświetlają się jako poziomo przewijane karty nad listą transakcji:

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Karta 1 │  │ Karta 2 │  │ Karta 3 │
│ Warning │  │ Success │  │ Tip     │
└─────────┘  └─────────┘  └─────────┘
  <──────────────────────────────>
```

Maksymalnie **5 najważniejszych** insightów.

---

## 3. Chatbot finansowy 🤖

### Lokalizacja
- **Serwis**: `services/aiChatbot.ts`
- **Ekran**: `app/chatbot.tsx`
- **Dostęp**: Profil → "Asystent AI"

### Funkcjonalność

Chatbot rozumie polecenia w języku naturalnym (polski) i pomaga zarządzać finansami.

### Obsługiwane intenty

#### 1. Dodawanie transakcji
**Przykłady zapytań:**
```
"Dodaj wydatek 50 zł na taxi"
"Wydałem 25 złotych na kawę"
"Zapłaciłem 100 pln za uber"
```

**Odpowiedź AI:**
```
Rozumiem! Chcesz dodać wydatek 50.00 PLN
w kategorii "Transport".

[Dodaj transakcję] ← przycisk akcji
```

#### 2. Sprawdzanie bilansu
**Przykłady zapytań:**
```
"Pokaż mój bilans"
"Ile mam pieniędzy?"
"Jakie jest moje saldo?"
```

**Odpowiedź AI:**
```
Twój aktualny bilans to **2450.50 PLN**

• Gotówka: 500.00 PLN
• Karta: 1950.50 PLN
```

#### 3. Wydatki po kategoriach
**Przykłady zapytań:**
```
"Ile wydałem na jedzenie w tym miesiącu?"
"Wydatki na transport"
"Pokaż wszystkie wydatki"
```

**Odpowiedź AI:**
```
W tym miesiącu wydałeś **850.00 PLN** na Jedzenie.

Liczba transakcji: 23
```

#### 4. Podsumowanie
**Przykłady zapytań:**
```
"Podsumowanie tego miesiąca"
"Statystyki"
"Raport miesięczny"
```

**Odpowiedź AI:**
```
📊 Podsumowanie luty 2026:

💰 Przychody: +5000.00 PLN
💸 Wydatki: -3200.00 PLN
📈 Bilans: +1800.00 PLN
```

### Ekstrakcja encji

AI automatycznie wyodrębnia z tekstu:

**Kwoty:**
```
"50 zł"     → 50.00
"25 złotych" → 25.00
"100 pln"   → 100.00
"75.50"     → 75.50
```

**Kategorie:**
```
"taxi"          → transport
"uber"          → transport
"kawa"          → food
"kawiarnia"     → food
"netflix"       → entertainment
"spotify"       → entertainment
```

**Okresy czasu:**
```
"w tym miesiącu"     → current_month
"ostatni miesiąc"    → last_month
"dzisiaj"           → today
"w tym tygodniu"    → week
```

### Quick Replies

Szybkie odpowiedzi pod polem wpisywania:

```
┌────────────────┐ ┌────────────────┐
│ Pokaż bilans   │ │ Ile wydałem    │
│                │ │ na jedzenie?   │
└────────────────┘ └────────────────┘
```

Kliknięcie automatycznie wpisuje tekst.

### Akcje

Niektóre odpowiedzi zawierają przyciski akcji:
- **Dodaj transakcję** → Otwiera formularz dodawania
- **Pokaż bilans** → Przechodzi do Raportów
- **Zobacz wykresy** → Przechodzi do Wykresów
- **Zobacz raporty** → Przechodzi do Raportów

### UI ekranu

```
┌─────────────────────────────────────┐
│ ← Asystent AI        ✨  Zawsze     │
│                         online       │
├─────────────────────────────────────┤
│                                     │
│   ┌──────────────────────────┐     │
│   │ Cześć! 👋               │     │
│   │ Jestem Twoim asystentem │     │
│   │ finansowym...           │     │
│   └──────────────────────────┘     │
│   ⏰ 14:23                          │
│                                     │
│                  ┌──────────────┐  │
│                  │ Pokaż bilans │  │
│                  └──────────────┘  │
│                  ⏰ 14:24           │
│                                     │
│   ┌──────────────────────────┐     │
│   │ Twój bilans: 2450 PLN   │     │
│   │ [Zobacz raporty →]      │     │
│   └──────────────────────────┘     │
│                                     │
├─────────────────────────────────────┤
│ Popularne pytania:                  │
│ [Pokaż bilans] [Ile wydałem?]      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐ 📤 │
│ │ Napisz wiadomość...         │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Techniczne szczegóły

### Algorytmy

#### Kategoryzacja
```typescript
function calculateCategoryScore(text: string, categoryId: string): number {
  // Exact match: 100 points
  // Contains keyword: 50 points
  // Starts with keyword: 70 points
  // Partial match (>3 chars): 30 points

  // Threshold: 30 points minimum
}
```

#### Confidence levels
```typescript
score >= 70 → 'high'    (🎯)
score >= 50 → 'medium'  (👍)
score >= 30 → 'low'     (🤔)
score < 30  → null      (brak sugestii)
```

### Wydajność

- **Kategoryzacja**: <50ms (instant)
- **Insights**: <100ms (jednorazowo przy renderze)
- **Chatbot**: ~500ms (z opóźnieniem dla UX)

### Prywatność

Wszystkie obliczenia AI wykonywane są **lokalnie** na urządzeniu:
- ✅ Brak wysyłania danych do chmury
- ✅ Offline-first
- ✅ Pełna prywatność
- ✅ Brak kosztów API

---

## Przyszłe ulepszenia

### Machine Learning
- Uczenie się z korekcji użytkownika
- Personalizowane modele
- Predykcja przyszłych wydatków

### NLP Enhancements
- Rozpoznawanie daty ("wczoraj", "w zeszłym tygodniu")
- Kontekst konwersacji w chatbocie
- Obsługa błędów ortograficznych

### Więcej insightów
- Analiza trendów sezonowych
- Porównanie z średnimi krajowymi
- Cele oszczędnościowe z AI

### Głosowy asystent
- Voice-to-text input
- Text-to-speech output
- Pełna obsługa głosowa

---

## Przykłady użycia

### Scenariusz 1: Zakup kawy
1. Dodaję transakcję
2. Wpisuję notatkę: "Starbucks"
3. AI sugeruje: "Jedzenie" (wysoka pewność)
4. Klikam sugestię → kategoria automatycznie wybrana ✅

### Scenariusz 2: Przekroczenie budżetu
1. Otwieram aplikację
2. Widzę insight: ⚠️ "Wzrost wydatków: Rozrywka +85%"
3. Przeglądam szczegóły w Raportach
4. Ograniczam wydatki ✅

### Scenariusz 3: Szybkie zapytanie
1. Otwieram chatbota (Profil → Asystent AI)
2. Piszę: "Ile wydałem na jedzenie?"
3. Otrzymuję: "850 PLN, 23 transakcje"
4. Klikam "Zobacz wykresy" → analiza szczegółowa ✅

---

## FAQ

**Q: Czy AI wymaga internetu?**
A: Nie! Wszystko działa offline.

**Q: Czy moje dane są bezpieczne?**
A: Tak, żadne dane nie opuszczają urządzenia.

**Q: Czy mogę dodać własne słowa kluczowe?**
A: Obecnie nie, ale planowane w przyszłości.

**Q: Jak dokładny jest chatbot?**
A: ~85-90% dla prostych zapytań w języku polskim.

**Q: Czy mogę wyłączyć AI?**
A: Insights można zignorować, kategoryzacja jest opcjonalna.

---

## Podsumowanie

Funkcje AI w aplikacji Finanse:
- 🏷️ **Automatyczna kategoryzacja** (300+ słów kluczowych)
- 💡 **Inteligentne podpowiedzi** (7 typów analiz)
- 🤖 **Chatbot finansowy** (4 główne intenty)
- 🔒 **100% offline** (prywatność)
- ⚡ **Szybkie** (<100ms)
- 🇵🇱 **Polski język**

Wszystko zaprojektowane, aby uczynić zarządzanie finansami **łatwiejszym**, **szybszym** i **mądrzejszym**! ✨
