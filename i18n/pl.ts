export const pl = {
  // Navigation
  nav: {
    records: 'Zapisy',
    charts: 'Wykresy',
    reports: 'Raporty',
    profile: 'Profil',
  },

  // Main screen
  main: {
    title: 'Finanse',
    noTransactions: 'Brak transakcji',
    addFirst: 'Dodaj pierwsza transakcje',
  },

  // Transaction types
  transaction: {
    expense: 'Wydatek',
    income: 'Przychod',
    transfer: 'Przelew',
  },

  // Add transaction
  add: {
    title: 'Nowa transakcja',
    editTitle: 'Edytuj transakcje',
    amount: 'Kwota',
    category: 'Kategoria',
    account: 'Konto',
    fromAccount: 'Z konta',
    toAccount: 'Na konto',
    note: 'Notatka',
    notePlaceholder: 'Dodaj notatke...',
    date: 'Data',
    selectDate: 'Wybierz date',
    save: 'Zapisz',
    saveChanges: 'Zapisz zmiany',
    cancel: 'Anuluj',
  },

  // Categories
  categories: {
    food: 'Jedzenie',
    transport: 'Transport',
    shopping: 'Zakupy',
    entertainment: 'Rozrywka',
    health: 'Zdrowie',
    bills: 'Rachunki',
    education: 'Edukacja',
    other: 'Inne',
    salary: 'Wynagrodzenie',
    gift: 'Prezent',
    investment: 'Inwestycje',
  },

  // Charts
  charts: {
    title: 'Wykresy',
    week: 'Tydzien',
    month: 'Miesiac',
    year: 'Rok',
    expenses: 'Wydatki',
    income: 'Przychody',
    noData: 'Brak danych do wyswietlenia',
  },

  // Reports
  reports: {
    title: 'Raporty',
    accounts: 'Konta',
    assets: 'Aktywa',
    totalAssets: 'Suma aktywow',
    addAccount: 'Dodaj konto',
    deleteAccount: 'Usun konto',
    accountName: 'Nazwa konta',
    balance: 'Saldo',
    analytics: 'Analityka',
  },

  // Profile
  profile: {
    title: 'Profil',
    login: 'Zaloguj sie',
    logout: 'Wyloguj sie',
    settings: 'Ustawienia',
    loggedAs: 'Zalogowany jako',
    guest: 'Gosc',
    sync: 'Synchronizacja',
    syncEnabled: 'Wlaczona',
    syncDisabled: 'Wylaczona',
    darkMode: 'Tryb ciemny',
    language: 'Jezyk',
    version: 'Wersja',
    about: 'O aplikacji',
  },

  // Settings
  settings: {
    title: 'Ustawienia',
    general: 'Ogolne',
    appearance: 'Wyglad',
    data: 'Dane',
    exportData: 'Eksportuj dane',
    importData: 'Importuj dane',
    clearData: 'Wyczysc dane',
    clearDataConfirm: 'Czy na pewno chcesz usunac wszystkie dane?',
    exportSuccess: 'Dane zostaly wyeksportowane',
    exportFailed: 'Nie udalo sie wyeksportowac danych',
    exportFormat: 'Format eksportu',
    exportJSON: 'JSON (pelne dane)',
    exportCSV: 'CSV (arkusz kalkulacyjny)',
  },

  // Recurring
  recurring: {
    title: 'Platnosci cykliczne',
    add: 'Dodaj platnosc cykliczna',
    edit: 'Edytuj platnosc cykliczna',
    frequency: 'Czestotliwosc',
    daily: 'Codziennie',
    weekly: 'Co tydzien',
    monthly: 'Co miesiac',
    yearly: 'Co rok',
    nextOccurrence: 'Nastepna platnosc',
    active: 'Aktywna',
    inactive: 'Nieaktywna',
    noRecurring: 'Brak platnosci cyklicznych',
    deleteConfirm: 'Czy na pewno chcesz usunac ta platnosc cykliczna?',
    processed: 'Przetworzono automatyczne transakcje',
  },

  // Budgets
  budgets: {
    title: 'Budzety',
    add: 'Dodaj budzet',
    edit: 'Edytuj budzet',
    limit: 'Limit',
    spent: 'Wydano',
    remaining: 'Pozostalo',
    period: 'Okres',
    monthly: 'Miesiecznie',
    yearly: 'Rocznie',
    noBudgets: 'Brak budzetow',
    overBudget: 'Przekroczono budzet!',
    nearLimit: 'Zblizasz sie do limitu',
    deleteConfirm: 'Czy na pewno chcesz usunac ten budzet?',
    selectCategory: 'Wybierz kategorie',
    progress: 'Postep',
  },

  // Search
  search: {
    placeholder: 'Szukaj transakcji...',
    noResults: 'Brak wynikow',
    filters: 'Filtry',
    type: 'Typ',
    category: 'Kategoria',
    amountRange: 'Zakres kwot',
    minAmount: 'Min kwota',
    maxAmount: 'Max kwota',
    clearFilters: 'Wyczysc filtry',
  },

  // Common
  common: {
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usun',
    edit: 'Edytuj',
    confirm: 'Potwierdz',
    search: 'Szukaj',
    filter: 'Filtruj',
    all: 'Wszystkie',
    today: 'Dzisiaj',
    yesterday: 'Wczoraj',
    thisWeek: 'Ten tydzien',
    thisMonth: 'Ten miesiac',
    currency: 'PLN',
    saving: 'Zapisywanie...',
  },

  // Errors
  errors: {
    errorTitle: 'Blad',
    generic: 'Cos poszlo nie tak. Sprobuj ponownie.',
    network: 'Blad sieci. Sprawdz polaczenie internetowe.',
    invalidAmount: 'Wprowadz prawidlowa kwote wieksza od zera.',
    selectCategory: 'Wybierz kategorie.',
    selectAccount: 'Wybierz konto.',
    sameAccount: 'Nie mozna przelac na to samo konto.',
    saveFailed: 'Nie udalo sie zapisac transakcji. Sprobuj ponownie.',
    loadTransactionsFailed: 'Nie udalo sie zaladowac transakcji.',
    loadAccountsFailed: 'Nie udalo sie zaladowac kont.',
    addTransactionFailed: 'Nie udalo sie dodac transakcji.',
    updateTransactionFailed: 'Nie udalo sie zaktualizowac transakcji.',
    deleteTransactionFailed: 'Nie udalo sie usunac transakcji.',
    addAccountFailed: 'Nie udalo sie dodac konta.',
    deleteAccountFailed: 'Nie udalo sie usunac konta.',
    loginFailed: 'Nie udalo sie zalogowac. Sprawdz dane logowania.',
    syncFailed: 'Synchronizacja nie powiodla sie. Sprobuj ponownie.',
    transactionNotFound: 'Nie znaleziono transakcji.',
    enterAccountName: 'Wprowadz nazwe konta.',
  },
};

export type TranslationKeys = typeof pl;
