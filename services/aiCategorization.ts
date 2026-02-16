/**
 * AI Service for automatic transaction categorization
 * Uses pattern matching and keyword analysis to suggest categories
 */

import { ALL_CATEGORIES } from '@/constants/categories';

// Keywords database for categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    'macdonalds', 'mcdonald', 'mcdonalds', 'kfc', 'burger', 'pizza', 'restauracja',
    'restaurant', 'kebab', 'food', 'jedzenie', 'kawiarnia', 'cafe', 'kawa',
    'coffee', 'piekarnia', 'bakery', 'sklep spożywczy', 'biedronka', 'lidl',
    'żabka', 'zabka', 'carrefour', 'auchan', 'tesco', 'kaufland', 'netto',
    'grocery', 'supermarket', 'market', 'starbucks', 'costa', 'subway',
    'frytki', 'obiad', 'śniadanie', 'kolacja', 'lunch', 'dinner', 'breakfast',
    'bar mleczny', 'bistro', 'fastfood', 'fast food', 'posiłek', 'meal'
  ],
  transport: [
    'uber', 'bolt', 'taxi', 'free now', 'mytaxi', 'transport', 'przejazd',
    'benzyna', 'petrol', 'gas', 'paliwo', 'orlen', 'bp', 'shell', 'lotos',
    'parking', 'parkowanie', 'bilet', 'ticket', 'mpk', 'ztm', 'komunikacja',
    'metro', 'tram', 'tramwaj', 'autobus', 'bus', 'train', 'pociąg', 'pkp',
    'kolej', 'przejazd', 'trip', 'ride', 'myjnia', 'car wash', 'mechanik',
    'auto serwis', 'warsztat', 'naprawa auta', 'olej', 'oil change'
  ],
  shopping: [
    'allegro', 'amazon', 'ebay', 'aliexpress', 'sklep', 'shop', 'shopping',
    'zakupy', 'mall', 'galeria', 'centrum handlowe', 'butik', 'boutique',
    'ubrania', 'clothes', 'odzież', 'buty', 'shoes', 'reserved', 'h&m',
    'zara', 'nike', 'adidas', 'eobuwie', 'zalando', 'modivo', 'electronics',
    'elektronika', 'rtv euro agd', 'media expert', 'media markt', 'empik',
    'rossmann', 'hebe', 'sephora', 'kosmetyki', 'cosmetics', 'perfumy'
  ],
  entertainment: [
    'netflix', 'hbo', 'disney', 'spotify', 'youtube', 'prime video', 'apple tv',
    'kino', 'cinema', 'theater', 'teatr', 'film', 'movie', 'concert', 'koncert',
    'bilety', 'tickets', 'club', 'klub', 'disco', 'dyskoteka', 'bar', 'pub',
    'rozrywka', 'entertainment', 'games', 'gry', 'steam', 'playstation', 'xbox',
    'nintendo', 'gaming', 'hobby', 'książki', 'books', 'muzyka', 'music',
    'fitness', 'siłownia', 'gym', 'basen', 'pool', 'squash', 'sport'
  ],
  health: [
    'apteka', 'pharmacy', 'leki', 'medicine', 'lekarz', 'doctor', 'dentysta',
    'dentist', 'przychodnia', 'clinic', 'szpital', 'hospital', 'wizyta lekarska',
    'badanie', 'test', 'medical', 'zdrowie', 'health', 'okulary', 'glasses',
    'optyk', 'optician', 'rehabilitacja', 'fizjoterapeuta', 'masaż', 'massage',
    'psycholog', 'terapia', 'therapy', 'wellness', 'spa', 'vitamin', 'witaminy',
    'suplementy', 'supplements', 'dbam', 'luxmed', 'medicover', 'enel-med'
  ],
  bills: [
    'prąd', 'electricity', 'tauron', 'pge', 'energa', 'enea', 'gaz', 'gas',
    'pgnig', 'woda', 'water', 'czynsz', 'rent', 'mieszkanie', 'wynajem',
    'rachunki', 'bills', 'opłaty', 'charges', 'internet', 'net', 'play',
    'orange', 'plus', 't-mobile', 'telekomunikacja', 'telefon', 'phone',
    'mobile', 'komórka', 'abonament', 'subscription', 'tv', 'telewizja',
    'nc+', 'canal+', 'polsat', 'ubezpieczenie', 'insurance', 'pzu', 'warta'
  ],
  education: [
    'książka', 'book', 'kurs', 'course', 'szkolenie', 'training', 'udemy',
    'coursera', 'edukacja', 'education', 'studia', 'university', 'uczelnia',
    'szkoła', 'school', 'czesne', 'tuition', 'akademia', 'academy', 'nauka',
    'learning', 'language', 'język', 'lekcje', 'lessons', 'korepetycje',
    'tutoring', 'egzamin', 'exam', 'certyfikat', 'certificate', 'podręcznik',
    'textbook', 'materiały', 'materials', 'workshop', 'warsztat'
  ],
  other_expense: [
    'inne', 'other', 'różne', 'misc', 'miscellaneous', 'przelew', 'transfer',
    'opłata', 'fee', 'prowizja', 'commission'
  ],
  salary: [
    'wynagrodzenie', 'salary', 'pensja', 'płaca', 'wage', 'wypłata', 'paycheck',
    'pensja', 'etат', 'praca', 'work', 'employer', 'pracodawca', 'firma'
  ],
  gift: [
    'prezent', 'gift', 'podarunek', 'gratulacje', 'congratulations', 'urodziny',
    'birthday', 'nagroda', 'prize', 'reward', 'bonus', 'zwrot', 'refund',
    'cashback', 'wygranie', 'win', 'loteria', 'lottery'
  ],
  investment: [
    'inwestycja', 'investment', 'akcje', 'stocks', 'obligacje', 'bonds',
    'fundusz', 'fund', 'dywidenda', 'dividend', 'zysk', 'profit', 'crypto',
    'bitcoin', 'ethereum', 'trading', 'broker', 'etf', 'ikze', 'ike', 'ppp'
  ],
  other_income: [
    'inne przychody', 'inne', 'other income', 'dodatkowe', 'additional'
  ]
};

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Calculate similarity score between text and category
 */
function calculateCategoryScore(text: string, categoryId: string): number {
  const normalizedText = normalizeText(text);
  const keywords = CATEGORY_KEYWORDS[categoryId] || [];

  let score = 0;
  let maxScore = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);

    // Exact match
    if (normalizedText === normalizedKeyword) {
      score += 100;
      maxScore = Math.max(maxScore, 100);
    }
    // Contains keyword
    else if (normalizedText.includes(normalizedKeyword)) {
      score += 50;
      maxScore = Math.max(maxScore, 50);
    }
    // Keyword at start
    else if (normalizedText.startsWith(normalizedKeyword)) {
      score += 70;
      maxScore = Math.max(maxScore, 70);
    }
    // Partial match (keyword contains text)
    else if (normalizedKeyword.includes(normalizedText) && normalizedText.length > 3) {
      score += 30;
      maxScore = Math.max(maxScore, 30);
    }
  }

  return maxScore;
}

/**
 * Suggest category based on transaction note
 */
export function suggestCategory(
  note: string,
  transactionType: 'expense' | 'income' | 'transfer'
): string | null {
  if (!note || note.trim().length < 2) {
    return null;
  }

  // Get categories for this transaction type
  const availableCategories = ALL_CATEGORIES.filter(
    cat => cat.type === transactionType
  );

  // Calculate scores for all categories
  const scores = availableCategories.map(category => ({
    categoryId: category.id,
    score: calculateCategoryScore(note, category.id),
  }));

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // Return best match if score is high enough
  const bestMatch = scores[0];
  if (bestMatch && bestMatch.score >= 30) {
    return bestMatch.categoryId;
  }

  return null;
}

/**
 * Get suggested category with confidence level
 */
export function getCategorySuggestion(
  note: string,
  transactionType: 'expense' | 'income' | 'transfer'
): {
  categoryId: string | null;
  confidence: 'high' | 'medium' | 'low';
} {
  if (!note || note.trim().length < 2) {
    return { categoryId: null, confidence: 'low' };
  }

  const availableCategories = ALL_CATEGORIES.filter(
    cat => cat.type === transactionType
  );

  const scores = availableCategories.map(category => ({
    categoryId: category.id,
    score: calculateCategoryScore(note, category.id),
  }));

  scores.sort((a, b) => b.score - a.score);

  const bestMatch = scores[0];

  if (!bestMatch || bestMatch.score < 30) {
    return { categoryId: null, confidence: 'low' };
  }

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestMatch.score >= 70) {
    confidence = 'high';
  } else if (bestMatch.score >= 50) {
    confidence = 'medium';
  }

  return { categoryId: bestMatch.categoryId, confidence };
}

/**
 * Learn from user corrections (future enhancement)
 * This can be used to improve categorization over time
 */
export function learnFromCorrection(
  note: string,
  suggestedCategory: string,
  actualCategory: string
): void {
  // TODO: Implement machine learning feedback loop
  // For now, this is a placeholder for future ML integration
  console.log('AI Learning:', { note, suggestedCategory, actualCategory });
}
