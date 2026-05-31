export type Language = 'pl' | 'en'

export const translations = {
  pl: {
    // Chatbot UI
    chatbot: {
      title: 'W czym mogę pomóc?',
      subtitle: 'Asystent KompasSeniora',
      placeholder: 'Napisz pytanie...',
      send: 'Wyślij wiadomość',
      close: 'Zamknij (Esc)',
      clearChat: 'Wyczyść czat',
      retry: 'Spróbuj ponownie',
      searching: 'Szukam...',
      welcome: 'Cześć! Jestem asystentem AI Kompas Seniora\n\nPomogę Ci znaleźć DPS, Klub Seniora lub Dzienny Dom Senior+ w Małopolsce i na Śląsku, i odpowiem na pytania o opiekę nad seniorem.\n\nWybierz temat z listy lub zadaj swoje pytanie:',
      tooltip: {
        title: '💡 Zapytaj mnie o placówki!',
        example: 'Np. "Szukam DPS w Krakowie" lub "Ile kosztuje pobyt?"',
      },
      errors: {
        tooManyRequests: 'Zbyt wiele zapytań. Poczekaj chwilę (ok. 1 min) i spróbuj ponownie.',
        unavailable: 'Chatbot chwilowo niedostępny. Spróbuj później lub skorzystaj z menu powyżej.',
        network: 'Przepraszam, wystąpił problem z połączeniem. Sprawdź internet i spróbuj ponownie.',
        generic: 'Przepraszam, wystąpił błąd.',
      },
    },
    // Quick prompts
    prompts: [
      { text: 'Jak znaleźć DPS?', href: '/poradniki/wybor-opieki/wybor-placowki' },
      { text: 'Ile kosztuje pobyt w DPS?', href: '/kalkulator' },
      { text: 'Czym jest Klub Seniora?', href: '/poradniki/wybor-opieki/wybor-placowki' },
      { text: 'Pokaż placówki w Krakowie', href: '/search?q=Kraków&powiat=krakowski&view=list' },
    ],
  },
  en: {
    // Chatbot UI
    chatbot: {
      title: 'How can I help?',
      subtitle: 'KompasSeniora Assistant',
      placeholder: 'Type your question...',
      send: 'Send message',
      close: 'Close (Esc)',
      clearChat: 'Clear chat',
      retry: 'Try again',
      searching: 'Searching...',
      welcome: 'Hi! I\'m the Kompas Seniora AI assistant\n\nI can help you find nursing homes (DPS), Senior Clubs or Senior+ Day Centers in Lesser Poland and Silesia, and answer questions about senior care.\n\nChoose a topic from the list or ask your question:',
      tooltip: {
        title: '💡 Ask me about facilities!',
        example: 'E.g., "Looking for nursing home in Krakow" or "How much does it cost?"',
      },
      errors: {
        tooManyRequests: 'Too many requests. Please wait a moment (~1 min) and try again.',
        unavailable: 'Chatbot temporarily unavailable. Please try later or use the menu above.',
        network: 'Sorry, there was a connection problem. Check your internet and try again.',
        generic: 'Sorry, an error occurred.',
      },
    },
    // Quick prompts
    prompts: [
      { text: 'How to find a nursing home?', href: '/poradniki/wybor-opieki/wybor-placowki' },
      { text: 'How much does it cost?', href: '/kalkulator' },
      { text: 'What is a Senior Club?', href: '/poradniki/wybor-opieki/wybor-placowki' },
      { text: 'Show facilities in Krakow', href: '/search?q=Kraków&powiat=krakowski&view=list' },
    ],
  },
}

export function t(lang: Language, key: string): any {
  const keys = key.split('.')
  let value: any = translations[lang]

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}
