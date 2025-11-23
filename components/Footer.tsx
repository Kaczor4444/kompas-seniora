import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 3 kolumny - centered na desktop, 3 kolumny też na mobile */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8 max-w-5xl mx-auto">
          {/* Kolumna 1: O nas */}
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-emerald-400">
              O nas
            </h3>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/o-nas" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  O nas
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/wspolpraca" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Współpraca
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/mapa-strony" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Mapa strony
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 2: Serwis */}
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-emerald-400">
              Serwis
            </h3>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/search" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Wyszukiwarka
                </Link>
              </li>
              <li>
                <Link href="/ulubione" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Ulubione
                </Link>
              </li>
              <li>
                <Link href="/kalkulator" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Kalkulator
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Poradnik
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 3: Prawne */}
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-emerald-400">
              Prawne
            </h3>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/polityka-prywatnosci" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Polityka Prywatności
                </Link>
              </li>
              <li>
                <Link href="/regulamin" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link href="/polityka-cookies" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Polityka Cookies
                </Link>
              </li>
              <li>
                <Link href="/wyglad-strony" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Wygląd strony
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright - jedna linia z źródłami */}
        <div className="border-t border-gray-700 pt-6 md:pt-8">
          <div className="text-center text-xs md:text-sm text-gray-400">
            <p>
              © {currentYear} <span className="text-emerald-400 font-semibold">Kompas Seniora</span> | Źródła: MOPS, BIP
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}