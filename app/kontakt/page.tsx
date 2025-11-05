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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Symulacja

    setIsSubmitting(false);
    setShowSuccess(true);
    setSelectedForm(null);

    // Auto-hide success message po 5 sekundach
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const cards = [
    {
      id: 'bug' as FormType,
      icon: Bug,
      title: 'Zgłoś błąd techniczny',
      description: 'Strona nie działa? Coś się zepsuło?',
    },
    {
      id: 'add' as FormType,
      icon: Plus,
      title: 'Dodaj placówkę',
      description: 'Znasz DPS który nie jest w naszej bazie?',
    },
    {
      id: 'edit' as FormType,
      icon: Edit,
      title: 'Popraw dane placówki',
      description: 'Widzisz błędny telefon, cenę lub adres?',
    },
    {
      id: 'general' as FormType,
      icon: MessageCircle,
      title: 'Napisz do nas',
      description: 'Pytanie? Sugestia? Współpraca?',
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

      {/* Success Message */}
      {showSuccess && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✅ Dziękujemy za zgłoszenie!
              </h3>
              <p className="text-green-800 leading-relaxed">
                Otrzymaliśmy Twoją wiadomość i wkrótce się z nią zapoznamy. 
                Jeśli podałeś email, skontaktujemy się z Tobą w razie potrzeby.
              </p>
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

        {/* Cards Grid - LŻEJSZA WERSJA */}
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
                  {/* Icon bez tła - minimalistyczny */}
                  <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <IconComponent className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-accent-600 transition-colors">
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
                className="text-accent-600 hover:text-accent-700 hover:underline"
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {selectedForm === 'bug' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gdzie wystąpił problem? (URL strony)
                    </label>
                    <input
                      type="url"
                      placeholder="https://kompaseniora.pl/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opisz problem *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Co się stało? Jakie kroki doprowadziły do błędu?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Przeglądarka
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Podaj jeśli chcesz otrzymać odpowiedź
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa placówki *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. DPS Vita"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typ placówki *
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    >
                      <option value="">Wybierz...</option>
                      <option>DPS</option>
                      <option>ŚDS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miejscowość *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. Kraków"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adres
                    </label>
                    <input
                      type="text"
                      placeholder="ul. Przykładowa 123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      placeholder="12 345 67 89"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dodatkowe informacje
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Strona www, cena, profil opieki..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                </>
              )}

              {selectedForm === 'edit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa placówki *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. DPS Vita Kraków"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Co jest błędne? *
                    </label>
                    <div className="space-y-2">
                      {['Telefon', 'Adres', 'Cena', 'Email', 'Strona WWW', 'Inne'].map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
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
                      placeholder="Wpisz poprawne dane..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twój email (opcjonalnie)
                    </label>
                    <input
                      type="email"
                      placeholder="twoj@email.pl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                </>
              )}

              {selectedForm === 'general' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twój email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="twoj@email.pl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temat *
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
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
                      placeholder="Napisz swoją wiadomość..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}