'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Bug, Plus, Edit, MessageCircle } from 'lucide-react';

type FormType = 'bug' | 'add' | 'edit' | 'general' | null;

export default function KontaktPage() {
  const [selectedForm, setSelectedForm] = useState<FormType>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setShowSuccess(true);
    setSelectedForm(null);

    setTimeout(() => setShowSuccess(false), 5000);
  };

  const cards = [
    {
      id: 'bug' as FormType,
      icon: Bug,
      title: 'Błąd na stronie',
      description: 'Coś nie działa? Pomóż nam to naprawić',
    },
    {
      id: 'add' as FormType,
      icon: Plus,
      title: 'Dodaj placówkę',
      description: 'Znasz DPS/ŚDS którego nie ma w bazie?',
    },
    {
      id: 'edit' as FormType,
      icon: Edit,
      title: 'Popraw dane',
      description: 'Widzisz błędny telefon lub adres?',
    },
    {
      id: 'general' as FormType,
      icon: MessageCircle,
      title: 'Kontakt ogólny',
      description: 'Pytanie? Sugestia? Napisz do nas',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Kontakt
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Jak możemy Ci pomóc?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Dziękujemy za zgłoszenie!
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                Otrzymaliśmy Twoją wiadomość i wkrótce się z nią zapoznamy. 
                Jeśli podałeś email, skontaktujemy się w razie potrzeby.
              </p>
              
              <button
                onClick={() => setShowSuccess(false)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-700 text-center">
            💡 Znalazłeś błąd? Pomóż nam go naprawić! 🛠️
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedForm(card.id)}
                className="bg-white rounded-xl border border-gray-200 p-8 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 group"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <IconComponent className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Direct Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📧 Kontakt bezpośredni
          </h3>
          <div className="space-y-3 text-gray-700">
            <p>
              <span className="font-medium">Email:</span>{' '}
              <a 
                href="mailto:kontakt@kompaseniora.pl" 
                className="text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                kontakt@kompaseniora.pl
              </a>
            </p>
            <p className="text-sm text-gray-600">
              Możesz również napisać do nas bezpośrednio na powyższy adres email.
            </p>
          </div>
        </div>
      </main>

      {/* Modal z formularzem */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {cards.find(c => c.id === selectedForm)?.title}
              </h2>
              <button
                onClick={() => setSelectedForm(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {selectedForm === 'bug' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gdzie pojawił się błąd?
                    </label>
                    <input
                      type="url"
                      placeholder="Adres strony, np. https://kompaseniora.pl/wyszukiwarka"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Co dokładnie się stało? *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Np. Po kliknięciu 'Pokaż więcej' strona się nie ładuje. Spróbowałem 2 razy."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jakiej używasz przeglądarki?
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base">
                      <option>Chrome</option>
                      <option>Safari</option>
                      <option>Firefox</option>
                      <option>Edge</option>
                      <option>Inna</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twój email (opcjonalnie)
                    </label>
                    <input
                      type="email"
                      placeholder="twoj@email.pl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Podaj, jeśli chcesz, żebyśmy dali znać gdy błąd zostanie naprawiony
                    </p>
                  </div>
                </>
              )}

              {selectedForm === 'add' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twój email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="twoj@email.pl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Do potwierdzenia zgłoszenia
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa placówki *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. DPS Vita"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miasto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. Kraków"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typ placówki *
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    >
                      <option value="">Wybierz...</option>
                      <option>DPS</option>
                      <option>ŚDS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adres (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      placeholder="ul. Przykładowa 123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon (opcjonalnie)
                    </label>
                    <input
                      type="tel"
                      placeholder="12 345 67 89"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dodatkowe informacje
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jeśli masz — podaj stronę www, profil opieki, orientacyjną cenę lub inne dane"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base resize-none"
                    />
                  </div>
                </>
              )}

              {selectedForm === 'edit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link do placówki *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="Wklej adres strony placówki z naszej wyszukiwarki"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      To pomoże nam szybko znaleźć właściwą placówkę
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Co jest błędne?
                    </label>
                    <div className="space-y-2">
                      {['Telefon', 'Adres', 'Cena', 'Email', 'Strona WWW', 'Inne'].map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prawidłowe dane *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Wpisz poprawne informacje — np. nowy numer telefonu: 12 345 67 89"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (opcjonalnie)
                    </label>
                    <input
                      type="email"
                      placeholder="twoj@email.pl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Podaj, jeśli możemy się z Tobą skontaktować w razie pytań
                    </p>
                  </div>
                </>
              )}

              {selectedForm === 'general' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="twoj@email.pl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temat *
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    >
                      <option value="">Wybierz...</option>
                      <option>Pytanie</option>
                      <option>Sugestia</option>
                      <option>Współpraca</option>
                      <option>Inne</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wiadomość *
                    </label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Opisz krótko, w czym możemy pomóc..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base resize-none"
                    />
                  </div>
                </>
              )}

              {/* Security Notice */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  🛡️ Twoje dane są bezpieczne. Używamy ich tylko do odpowiedzi na Twoją wiadomość.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Wysyłanie...' : 'Prześlij zgłoszenie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}