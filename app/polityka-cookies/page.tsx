import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polityka Cookies | Kompas Seniora',
  description: 'Polityka wykorzystywania plików cookies w serwisie Kompas Seniora.',
  robots: 'index, follow',
};

export default function PolitykaCookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Polityka Cookies
        </h1>
        
        <div className="prose prose-emerald max-w-none">
          <p className="text-sm text-gray-600 mb-8">
            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Czym są pliki cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pliki cookies (tzw. „ciasteczka") to niewielkie pliki tekstowe zapisywane na Twoim 
              urządzeniu (komputerze, tablecie, smartfonie) podczas przeglądania stron internetowych.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Cookies umożliwiają rozpoznanie Twojego urządzenia i dostosowanie wyświetlanej treści 
              do Twoich preferencji oraz potrzeb.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Jak wykorzystujemy cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Serwis <strong>kompaseniora.pl</strong> wykorzystuje pliki cookies w następujących celach:
            </p>
            
            <div className="space-y-6">
              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">🔧 Cookies niezbędne (techniczne)</h3>
                <p className="text-gray-700 mb-2">
                  Niezbędne do prawidłowego funkcjonowania Serwisu. Bez nich korzystanie z podstawowych 
                  funkcji nie byłoby możliwe.
                </p>
                <p className="text-sm text-gray-600 italic">
                  Przykłady: zapamiętywanie ustawień, sesja użytkownika
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Okres przechowywania:</strong> sesja lub do 12 miesięcy
                </p>
                <p className="text-sm text-emerald-600 font-semibold mt-2">
                  ✓ Ładowane automatycznie (nie wymagają zgody)
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Cookies analityczne</h3>
                <p className="text-gray-700 mb-2">
                  Pozwalają nam zrozumieć, w jaki sposób użytkownicy korzystają z Serwisu 
                  (np. które placówki są najczęściej przeglądane, jakie filtry są używane).
                </p>
                <p className="text-sm text-gray-600 italic">
                  Cel: poprawa funkcjonalności i doświadczenia użytkowników
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Okres przechowywania:</strong> do 24 miesięcy
                </p>
                <p className="text-sm text-blue-600 font-semibold mt-2">
                  ⚠ Wymagają aktywnej zgody użytkownika
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚙️ Cookies funkcjonalne</h3>
                <p className="text-gray-700 mb-2">
                  Zapamiętują Twoje preferencje (np. preferowany widok listy vs. mapy, 
                  ostatnio wybrane filtry wyszukiwania).
                </p>
                <p className="text-sm text-gray-600 italic">
                  Przykłady: preferencje wyświetlania, zapamiętane filtry
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Okres przechowywania:</strong> do 12 miesięcy
                </p>
                <p className="text-sm text-purple-600 font-semibold mt-2">
                  ⚠ Wymagają aktywnej zgody użytkownika
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cookies stron trzecich</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Serwis może wykorzystywać cookies podmiotów trzecich, w szczególności:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Mapy interaktywne</strong> - do wyświetlania map z lokalizacjami placówek</li>
              <li><strong>Usługi hostingowe</strong> - cookies techniczne związane z działaniem infrastruktury</li>
              <li><strong>Narzędzia analityczne</strong> (jeśli zostaną wdrożone) - do analizy ruchu na stronie</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Te podmioty mogą przetwarzać dane zgodnie z własnymi politykami prywatności. 
              Zalecamy zapoznanie się z ich dokumentami.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Jak zarządzać plikami cookies?</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-gray-700 font-semibold mb-2">
                💡 Masz pełną kontrolę nad plikami cookies!
              </p>
              <p className="text-gray-700">
                Możesz zarządzać cookies lub je całkowicie zablokować w ustawieniach swojej przeglądarki.
              </p>
            </div>

            <h3 className="font-semibold text-gray-900 mb-3">Instrukcje dla popularnych przeglądarek:</h3>
            
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">Google Chrome:</span>
                <span>Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i inne dane witryn</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">Mozilla Firefox:</span>
                <span>Opcje → Prywatność i bezpieczeństwo → Pliki cookie i dane witryn</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">Safari:</span>
                <span>Preferencje → Prywatność → Zarządzaj danymi witryn</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-[140px]">Microsoft Edge:</span>
                <span>Ustawienia → Pliki cookie i uprawnienia witryny → Pliki cookie i dane witryn</span>
              </div>
            </div>

            <div className="bg-warning-50 border-l-4 border-warning p-4 mt-6">
              <p className="text-gray-700">
                <strong>⚠️ Uwaga:</strong> Zablokowanie cookies może ograniczyć funkcjonalność Serwisu 
                (np. preferencje wyszukiwania nie będą zapamiętywane, mapa może nie działać poprawnie).
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Twoje prawa</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Zgodnie z RODO i przepisami o telekomunikacji, przysługują Ci następujące prawa:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Prawo do wycofania zgody</strong> - możesz w każdej chwili zmienić ustawienia cookies w przeglądarce</li>
              <li><strong>Prawo dostępu</strong> - możesz sprawdzić jakie cookies są zapisane w przeglądarce</li>
              <li><strong>Prawo do usunięcia</strong> - możesz usunąć wszystkie cookies w ustawieniach przeglądarki</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Zmiany w Polityce Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce Cookies. 
              O wszelkich istotnych zmianach użytkownicy zostaną poinformowani poprzez komunikat w Serwisie.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Więcej informacji</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Jeśli masz pytania dotyczące wykorzystywania plików cookies, skontaktuj się z nami:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a></li>
              <li><a href="/kontakt" className="text-emerald-600 hover:text-emerald-700 underline">Formularz kontaktowy</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Zobacz także: <a href="/polityka-prywatnosci" className="text-emerald-600 hover:text-emerald-700 underline">Polityka Prywatności</a>
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Więcej informacji o plikach cookies: <a href="https://wszystkoociasteczkach.pl" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline">wszystkoociasteczkach.pl</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <a 
            href="/"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Powrót do strony głównej
          </a>
        </div>
      </div>
    </div>
  );
}