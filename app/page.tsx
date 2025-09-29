'use client';

import { useState } from 'react';

export default function Home() {
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;
    
    setIsSearching(true);
    
    try {
      console.log('Szukam DPS dla:', searchLocation);
      alert(`Szukam domów opieki w okolicy: ${searchLocation}`);
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      alert('Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Wyszukiwarka
              </a>
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Kalkulator
              </a>
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Poradnik
              </a>
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Kontakt
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Lottie Style */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-accent-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          {/* Trustpilot Badge */}
          <div className="flex justify-center mb-8">
            <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-neutral-200">
              <span className="text-sm text-neutral-700">⭐⭐⭐⭐⭐ Zaufana platforma</span>
            </div>
          </div>
          
          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
              Znajdź najlepszy dom opieki<br />w Twojej okolicy
            </h1>
            <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
              Transparentna wyszukiwarka publicznych domów pomocy społecznej z oficjalnymi cenami
            </p>
          </div>
          
          {/* Category Tabs - Responsive with Tooltips */}
          <div className="flex justify-center gap-2 mb-8 max-w-2xl mx-auto">
            <div className="relative group">
            <button className="bg-white border-2 border-accent-500 text-neutral-900 px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all leading-tight text-center transform hover:scale-105">
                <span className="hidden sm:inline">Domy Pomocy<br />Społecznej</span>
                <span className="sm:hidden">DPS</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-accent-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
                Stacjonarne placówki dla osób wymagających całodobowej opieki
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-accent-500"></div>
              </div>
            </div>
            
            <div className="relative group">
            <button className="bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all leading-tight text-center transform hover:scale-105">
                <span className="hidden sm:inline">Środowiskowe<br />Domy<br />Samopomocy</span>
                <span className="sm:hidden">ŚDS</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-accent-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
                Ośrodki wsparcia dziennego dla osób z zaburzeniami psychicznymi
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-accent-500"></div>
              </div>
            </div>
            
            <div className="relative group">
            <button className="bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all leading-tight text-center transform hover:scale-105">
                <span className="hidden sm:inline">Kalkulator<br />Kosztów</span>
                <span className="sm:hidden">Kalkulator</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-accent-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
                Oblicz szacunkowe koszty opieki i zaplanuj budżet
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-accent-500"></div>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Lottie Style */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-full shadow-lg border border-neutral-200 flex items-center overflow-hidden">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Wpisz miejscowość, np. Kamienica, Mogilany..."
                className="flex-1 px-6 py-4 text-lg focus:outline-none"
                disabled={isSearching}
              />
              <button 
                type="submit"
                disabled={isSearching || !searchLocation.trim()}
                className="bg-accent-500 hover:bg-accent-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-8 py-4 font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isSearching ? 'Szukam...' : 'Szukaj'}
              </button>
            </div>
            <p className="text-sm text-neutral-500 text-center mt-3">
              Nie musisz znać powiatu - wpisz po prostu nazwę miejscowości
            </p>
          </form>
        </div>
      </section>

      {/* Stats Section - Flat Design */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-primary-700">2</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Placówki w bazie</h3>
              <p className="text-sm text-neutral-600">Sprawdzone domy pomocy społecznej</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-success-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-success-700">100%</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Oficjalne dane</h3>
              <p className="text-sm text-neutral-600">Ceny z urzędów miast i MOPS</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-4 h-14 bg-accent-100 rounded-full mb-4">
                <span className="text-sm font-bold text-accent-600">Małopolska</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Aktualnie dostępne</h3>
              <p className="text-sm text-neutral-600">Rozszerzamy na kolejne województwa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Dlaczego Kompas Seniora?
            </h2>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              Jedyna strona z transparentnymi cenami i inteligentną wyszukiwarką
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Inteligentna wyszukiwarka</h3>
              <p className="text-neutral-700">
                Wpisz "Kamienica" - znajdziemy powiat limanowski. Nie musisz znać struktur administracyjnych
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-success-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Transparentne ceny</h3>
              <p className="text-neutral-700">
                Oficjalne koszty pobytu z urzędów miast. Żadnych ukrytych opłat czy niespodzianek
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Kalkulator kosztów</h3>
              <p className="text-neutral-700">
                Zaplanuj budżet opieki. Porównaj różne opcje i przygotuj się finansowo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Rozpocznij poszukiwania już dziś
          </h2>
          <p className="text-xl text-neutral-700 mb-8">
            Pomożemy Ci znaleźć najlepszą opiekę dla Twojego bliskiego
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm hover:shadow-md">
              Znajdź dom opieki
            </button>
            <button className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-neutral-300 transition-colors">
              Użyj kalkulatora
            </button>
          </div>
        </div>
      </section>
      {/* Location Search Section */}
<section className="py-16 bg-neutral-50">
  <div className="max-w-6xl mx-auto px-6">
    <div className="flex items-center gap-3 mb-8">
      <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h2 className="text-3xl font-bold text-neutral-900">
        Szukasz w konkretnej lokalizacji?
      </h2>
    </div>
    
    {/* Category Tabs */}
    <div className="flex justify-center gap-2 mb-6">
      <button className="bg-white border-2 border-accent-500 text-neutral-900 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
        Domy Pomocy Społecznej (DPS)
      </button>
      <button className="bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
        Środowiskowe Domy Samopomocy (ŚDS)
      </button>
    </div>
    
    <div className="bg-white rounded-2xl border border-neutral-200 p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolumna 1 */}
        <div className="space-y-4">
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Kraków</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Limanowa</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Nowy Targ</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
        {/* Kolumna 2 */}
        <div className="space-y-4">
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Nowy Sącz</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Wadowice</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Oświęcim</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
        {/* Kolumna 3 */}
        <div className="space-y-4">
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Tarnów</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Zakopane</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
            <span className="text-neutral-900 font-medium">DPS Myślenice</span>
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* View All Button */}
      <div className="mt-8 text-center">
        <button className="inline-flex items-center gap-2 bg-accent-100 hover:bg-accent-200 text-accent-700 px-6 py-3 rounded-lg font-medium transition-colors">
          Zobacz wszystkie lokalizacje
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</section>
{/* Newsletter Section */}
<section className="py-16 bg-gradient-to-br from-accent-500 to-accent-600">
  <div className="max-w-4xl mx-auto px-6">
    <div className="text-center mb-8">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Bądź na bieżąco z kompaseniora.pl
      </h2>
      <p className="text-lg text-accent-50 max-w-2xl mx-auto">
      Otrzymuj aktualizacje o nowych domach opieki, zmianach cen oraz wsparcie dla całej rodziny w opiece nad bliskimi.      </p>
    </div>
    
    <form className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Twój adres email"
          className="flex-1 px-6 py-4 rounded-lg text-lg text-neutral-900 placeholder:text-white border-2 border-white bg-white/10 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-white"        />
        <button
          type="submit"
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors whitespace-nowrap"
        >
          Zapisz się
        </button>
      </div>
      <p className="text-sm text-accent-50 mt-4 text-center">
        Nie dzielimy się danymi z nikim. Wypisz się kiedy chcesz.
      </p>
    </form>
  </div>
</section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-neutral-700">
              <a href="#" className="hover:text-neutral-900 transition-colors">Polityka prywatności</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Regulamin</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Kontakt</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-neutral-200 text-center">
            <p className="text-neutral-500 text-sm">
              © 2024 Kompas Seniora. Dane z oficjalnych źródeł MOPS i urzędów miast.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}