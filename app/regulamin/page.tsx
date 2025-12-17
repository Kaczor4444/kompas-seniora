import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regulamin | Kompas Seniora',
  description: 'Regulamin korzystania z serwisu Kompas Seniora - zasady użytkowania platformy.',
  robots: 'index, follow',
};

export default function RegulaminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Regulamin Serwisu
        </h1>
        
        <div className="prose prose-emerald max-w-none">
          <p className="text-sm text-gray-600 mb-8">
            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Postanowienia ogólne</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Niniejszy Regulamin określa zasady korzystania z serwisu internetowego 
              <strong> kompaseniora.pl</strong> (zwanego dalej „Serwisem").
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong>Właścicielem i administratorem Serwisu jest:</strong>
              </p>
              <p className="text-gray-700">
                <strong>[NAZWA FIRMY UK - np. Senior Compass Ltd.]</strong><br />
                Company Number: <strong>[NUMER REJESTRACYJNY]</strong><br />
                Adres siedziby: <strong>[ADRES UK - np. 123 Business Street, London, E1 6AN, United Kingdom]</strong>
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Korzystanie z Serwisu jest równoznaczne z akceptacją niniejszego Regulaminu.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definicje</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Serwis</strong> – serwis internetowy dostępny pod adresem kompaseniora.pl</li>
              <li><strong>Użytkownik</strong> – każda osoba fizyczna lub prawna korzystająca z Serwisu</li>
              <li><strong>Placówka</strong> – publiczna placówka opieki dla seniorów (DPS lub ŚDS) prezentowana w Serwisie</li>
              <li><strong>Administrator</strong> – podmiot wskazany w punkcie 1, odpowiedzialny za funkcjonowanie Serwisu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Zakres usług Serwisu</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Serwis świadczy usługi informacyjne polegające na:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Udostępnianiu informacji o publicznych placówkach opieki dla seniorów (DPS i ŚDS)</li>
              <li>Prezentowaniu oficjalnych cen z MOPS (Miejskich Ośrodków Pomocy Społecznej)</li>
              <li>Umożliwianiu wyszukiwania placówek według lokalizacji i innych kryteriów</li>
              <li>Wyświetlaniu kontaktów do placówek (telefon, email, strona www)</li>
              <li>Wizualizacji placówek na mapie interaktywnej</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Ważne:</strong> Serwis pełni wyłącznie funkcję informacyjną. Nie pośredniczymy 
                w rezerwacjach miejsc w placówkach ani nie prowadzimy działalności pośrednictwa. 
                Wszelkie decyzje dotyczące wyboru placówki i kontaktu z nią podejmuje Użytkownik samodzielnie.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Zasady korzystania z Serwisu</h2>
            <div className="space-y-4 text-gray-700">
              <div className="border-l-4 border-emerald-500 pl-4">
                <h3 className="font-semibold mb-2">4.1. Dostęp do Serwisu</h3>
                <p>Korzystanie z Serwisu jest <strong>bezpłatne</strong> i nie wymaga rejestracji.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold mb-2">4.2. Wymogi techniczne</h3>
                <p>Dostęp do Serwisu wymaga:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Urządzenia z dostępem do Internetu</li>
                  <li>Przeglądarki internetowej (Chrome, Firefox, Safari, Edge)</li>
                  <li>Włączonej obsługi JavaScript</li>
                  <li>Akceptacji plików cookies (opcjonalnie dla pełnej funkcjonalności)</li>
                </ul>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold mb-2">4.3. Zakazy</h3>
                <p>Użytkownik zobowiązuje się do:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Nieingerowania w funkcjonowanie Serwisu</li>
                  <li>Niekopiowania treści w sposób naruszający prawa autorskie</li>
                  <li>Nieużywania Serwisu w sposób sprzeczny z prawem lub dobrymi obyczajami</li>
                  <li>Niepodejmowania prób nieautoryzowanego dostępu do systemów</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Źródła danych i odpowiedzialność</h2>
            <div className="bg-warning-50 border-l-4 border-warning p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Ważne zastrzeżenie:</strong> Informacje prezentowane w Serwisie pochodzą 
                z oficjalnych źródeł publicznych (MOPS, strony BIP, strony placówek). Dokładamy 
                wszelkich starań, aby dane były aktualne i poprawne, jednak:
              </p>
            </div>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Administrator nie ponosi odpowiedzialności za ewentualne nieścisłości w danych pochodzących ze źródeł zewnętrznych</li>
              <li>Ceny i dostępność miejsc mogą ulec zmianie bez powiadomienia</li>
              <li><strong>Użytkownik powinien zawsze weryfikować informacje bezpośrednio z placówką przed podjęciem decyzji</strong></li>
              <li>Administrator nie ponosi odpowiedzialności za decyzje podjęte wyłącznie na podstawie informacji z Serwisu</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Aktualizacja danych:</strong> Dane są weryfikowane i aktualizowane regularnie 
              (co najmniej raz w roku). Data ostatniej aktualizacji jest widoczna przy każdej placówce.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prawa własności intelektualnej</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wszelkie treści zamieszczone w Serwisie, w tym grafika, układ strony, kod źródłowy, 
              są chronione prawami autorskimi i stanowią własność Administratora.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Użytkownik może korzystać z treści Serwisu wyłącznie na użytek osobisty, niekomercyjny. 
              Kopiowanie, rozpowszechnianie lub publiczne udostępnianie treści w celach komercyjnych 
              wymaga pisemnej zgody Administratora.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Ochrona danych osobowych</h2>
            <p className="text-gray-700 leading-relaxed">
              Zasady przetwarzania danych osobowych określa 
              {' '}<a href="/polityka-prywatnosci" className="text-emerald-600 hover:text-emerald-700 underline">
                Polityka Prywatności
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Pliki cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Szczegółowe informacje na temat wykorzystywania plików cookies znajdują się w 
              {' '}<a href="/polityka-cookies" className="text-emerald-600 hover:text-emerald-700 underline">
                Polityce Cookies
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Wyłączenie odpowiedzialności</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Administrator nie ponosi odpowiedzialności za:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Przerwy w dostępie do Serwisu wynikające z przyczyn technicznych lub działania siły wyższej</li>
              <li>Działania osób trzecich (placówek, MOPS-ów) nieprzestrzegających podanych informacji</li>
              <li>Szkody wynikłe z korzystania lub niemożności korzystania z Serwisu</li>
              <li>Treści dostępne na stronach zewnętrznych linkowanych z Serwisu</li>
              <li>Decyzje Użytkowników podjęte na podstawie informacji z Serwisu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Punkt kontaktowy (DSA)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Zgodnie z Rozporządzeniem o Usługach Cyfrowych (DSA), wyznaczamy punkt kontaktowy:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a></li>
              <li>Języki komunikacji: polski, angielski</li>
              <li><a href="/kontakt" className="text-emerald-600 hover:text-emerald-700 underline">Formularz kontaktowy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Zgłaszanie nieprawidłowości</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Jeśli zauważysz nieprawidłowe, nieaktualne lub niezgodne z prawem informacje w Serwisie, 
              prosimy o kontakt:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-emerald-600 hover:text-emerald-700 underline">kontakt@kompaseniora.pl</a></li>
              <li><a href="/kontakt" className="text-emerald-600 hover:text-emerald-700 underline">Formularz kontaktowy</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Rozpatrzymy zgłoszenie w ciągu 7 dni roboczych i poinformujemy o podjętych działaniach, 
              stosując zasady transparentności i uzasadnienia decyzji zgodnie z DSA.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Postanowienia końcowe</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Administrator zastrzega sobie prawo do:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Zmiany Regulaminu (użytkownicy zostaną poinformowani o zmianach na stronie Serwisu)</li>
              <li>Czasowego zawieszenia działania Serwisu z przyczyn technicznych</li>
              <li>Modyfikacji funkcjonalności Serwisu w celu jego ulepszenia</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              W sprawach nieuregulowanych w niniejszym Regulaminie zastosowanie mają przepisy prawa polskiego.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Ewentualne spory będą rozstrzygane przez sąd właściwy według przepisów kodeksu postępowania cywilnego.
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