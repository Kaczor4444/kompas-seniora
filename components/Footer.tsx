import Link from 'next/link';
import CookieSettingsButton from './CookieSettingsButton';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">
              Kompas Seniora
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Wyszukiwarka publicznych placówek opieki dla seniorów.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">
              Serwis
            </h3>
            <ul className="space-y-2 text-sm">
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
                <Link href="/kontakt" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">
              Dokumenty prawne
            </h3>
            <ul className="space-y-2 text-sm">
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
                <CookieSettingsButton />
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">
              Źródła danych
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Informacje z oficjalnych źródeł publicznych.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Dane weryfikowane regularnie.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div className="mb-4 md:mb-0">
              <p>
                © {currentYear} <span className="text-emerald-400 font-semibold">Kompas Seniora</span>. 
                Wszelkie prawa zastrzeżone.
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs">
                Serwis ma charakter informacyjny.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}