import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polityka Prywatności | Kompas Seniora',
  description: 'Polityka prywatności i ochrony danych osobowych serwisu Kompas Seniora zgodnie z RODO.',
  robots: 'index, follow',
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Polityka Prywatności
        </h1>
        
        <div className="prose prose-emerald max-w-none">
          <p className="text-sm text-gray-600 mb-8">
            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Postanowienia ogólne i Administrator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych 
              użytkowników serwisu <strong>kompaseniora.pl</strong> (zwanego dalej „Serwisem").
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Administratorem danych osobowych jest:</strong>
              </p>
              <p className="text-gray-700">
                <strong>[NAZWA FIRMY UK - np. Senior Compass Ltd.]</strong><br />
                Company Number: <strong>[NUMER REJESTRACYJNY]</strong><br />
                Adres siedziby: <strong>[ADRES UK - np. 123 Business Street, London, E1 6AN, United Kingdom]</strong>
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Ochrona danych odbywa się zgodnie z wymogami powszechnie obowiązujących przepisów prawa, 
              w tym Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. 
              w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie 
              swobodnego przepływu takich danych (RODO).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Przedstawiciel RODO w Unii Europejskiej</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Zgodnie z art. 27 RODO, Administrator wyznaczył przedstawiciela w Polsce, 
              z którym można kontaktować się we wszystkich sprawach związanych z przetwarzaniem 
              danych osobowych i korzystaniem z praw:
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4">
              <p className="text-gray-700 mb-1">
                <strong>Przedstawiciel:</strong> [NAZWA FIRMY UK - np. Senior Compass Ltd.]
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Adres w Polsce:</strong> [ADRES WIRTUALNY - np. ul. Marszałkowska 10/5, 00-001 Warszawa]
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Email:</strong> <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a>
              </p>
              <p className="text-gray-700">
                <strong>Języki komunikacji:</strong> polski, angielski
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Rodzaje przetwarzanych danych</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Serwis przetwarza następujące kategorie danych:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Dane analityczne</strong>: informacje o aktywności w Serwisie (odsłony placówek, kliknięcia w kontakty)</li>
              <li><strong>Dane techniczne</strong>: adres IP, typ przeglądarki, system operacyjny, czas wizyty</li>
              <li><strong>Dane lokalizacyjne</strong> (opcjonalnie): współrzędne geograficzne pobierane z przeglądarki wyłącznie gdy użytkownik aktywuje funkcję wyszukiwania w pobliżu. Dane wykorzystywane są jedynie w danej sesji i nie są przechowywane</li>
              <li><strong>Pliki cookies</strong>: szczegóły w Polityce Cookies</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Ważne:</strong> Serwis nie wymaga rejestracji ani logowania użytkowników. 
              Nie zbieramy danych osobowych takich jak imię, nazwisko, email czy numer telefonu 
              (z wyjątkiem dobrowolnego kontaktu przez formularz).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cel i podstawa prawna przetwarzania</h2>
            <div className="space-y-4 text-gray-700">
              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="font-semibold mb-2">Świadczenie usług Serwisu</h3>
                <p>Podstawa prawna: Art. 6 ust. 1 lit. b) RODO (wykonanie umowy)</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold mb-2">Analiza statystyczna i poprawa Serwisu</h3>
                <p>Podstawa prawna: Art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony interes administratora - optymalizacja Serwisu, zwiększenie użyteczności, badanie efektywności działania)</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold mb-2">Marketing i komunikacja</h3>
                <p>Podstawa prawna: Art. 6 ust. 1 lit. a) RODO (zgoda użytkownika)</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold mb-2">Wyszukiwanie w pobliżu (funkcja opcjonalna)</h3>
                <p>Podstawa prawna: Art. 6 ust. 1 lit. a) RODO (zgoda użytkownika wyrażona w przeglądarce)</p>
                <p className="text-sm text-gray-600 mt-1">Gdy aktywujesz funkcję lokalizacji, przeglądarka zapyta o zgodę. Współrzędne są używane wyłącznie w bieżącej sesji do wyświetlenia placówek w Twojej okolicy.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Udostępnianie danych i przechowywanie</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Dane mogą być udostępniane następującym kategoriom odbiorców:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Dostawcom usług hostingowych i baz danych</li>
              <li>Dostawcom usług geolokalizacji</li>
              <li>Narzędziom analitycznym (jeśli zostaną wdrożone w przyszłości)</li>
              <li>Organom państwowym na podstawie przepisów prawa</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Nie sprzedajemy</strong> ani nie udostępniamy danych osobowych firmom trzecim 
              w celach marketingowych.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Lokalizacja serwerów:</strong> Dane są przechowywane i przetwarzane na serwerach 
                zlokalizowanych w Unii Europejskiej / Europejskim Obszarze Gospodarczym, 
                co gwarantuje pełną zgodność z RODO.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Okres przechowywania danych</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Dane analityczne</strong>: przez czas niezbędny do realizacji celów analitycznych (maksymalnie 24 miesiące)</li>
              <li><strong>Dane lokalizacyjne</strong>: wykorzystywane wyłącznie w danej sesji, nie są przechowywane na serwerze</li>
              <li><strong>Pliki cookies</strong>: zgodnie z Polityką Cookies (maksymalnie 12 miesięcy)</li>
              <li><strong>Logi systemowe</strong>: przez okres wymagany przepisami prawa (maksymalnie 12 miesięcy)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prawa użytkownika</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Przysługują Ci następujące prawa związane z przetwarzaniem danych osobowych:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Prawo dostępu</strong> do swoich danych (art. 15 RODO)</li>
              <li><strong>Prawo do sprostowania</strong> danych (art. 16 RODO)</li>
              <li><strong>Prawo do usunięcia</strong> danych („prawo do bycia zapomnianym", art. 17 RODO)</li>
              <li><strong>Prawo do ograniczenia przetwarzania</strong> (art. 18 RODO)</li>
              <li><strong>Prawo do przenoszenia danych</strong> (art. 20 RODO)</li>
              <li><strong>Prawo sprzeciwu</strong> wobec przetwarzania (art. 21 RODO)</li>
              <li><strong>Prawo do cofnięcia zgody</strong> w dowolnym momencie (jeśli przetwarzanie opiera się na zgodzie)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Aby skorzystać z powyższych praw, skontaktuj się z nami:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
              <li>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a></li>
              <li><a href="/kontakt" className="text-emerald-600 hover:text-emerald-700 underline">Formularz kontaktowy</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Prawo do skargi:</strong> Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych 
              (PUODO), jeśli uważasz, że przetwarzanie Twoich danych narusza przepisy RODO.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Profilowanie</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Ważne:</strong> Serwis <strong>nie profiluje</strong> użytkowników w sposób zautomatyzowany 
              ani nie podejmuje decyzji wpływających na Twoje prawa wyłącznie na podstawie automatycznego 
              przetwarzania danych.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Pliki cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Szczegółowe informacje na temat wykorzystywania plików cookies znajdują się w 
              {' '}<a href="/polityka-cookies" className="text-emerald-600 hover:text-emerald-700 underline">
                Polityce Cookies
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Źródła danych o placówkach</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Informacje o placówkach opieki prezentowane w Serwisie pochodzą z oficjalnych źródeł publicznych 
              (MOPS, strony BIP, strony internetowe placówek).
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Ważne:</strong> Dane są regularnie weryfikowane i aktualizowane (co najmniej raz w roku). 
                Zalecamy jednak bezpośrednią weryfikację aktualnych cen i dostępności miejsc z placówką.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Zmiany w Polityce Prywatności</h2>
            <p className="text-gray-700 leading-relaxed">
              Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. 
              O wszelkich zmianach użytkownicy zostaną poinformowani poprzez komunikat w Serwisie.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Punkt kontaktowy (DSA)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Zgodnie z Rozporządzeniem o Usługach Cyfrowych (DSA), punkt kontaktowy dla użytkowników, 
              organów państwowych i Komisji Europejskiej:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a></li>
              <li>Języki komunikacji: polski, angielski</li>
              <li><a href="/kontakt" className="text-emerald-600 hover:text-emerald-700 underline">Formularz kontaktowy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Zgłaszanie nieprawidłowości</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Jeśli zauważysz nieprawidłowe, nieaktualne lub niezgodne z prawem informacje w Serwisie, 
              prosimy o kontakt:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Rozpatrzymy zgłoszenie w ciągu 7 dni roboczych i poinformujemy o podjętych działaniach.
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