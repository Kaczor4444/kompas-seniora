import Link from 'next/link';
import { Mail } from 'lucide-react';

const FooterLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path 
      d="M20 34C20 34 5 26 5 15C5 9 10 5 14 5C17 5 19 7 20 8C21 7 23 5 26 5C30 5 35 9 35 15C35 26 20 34 20 34Z" 
      className="stroke-primary-500" 
      strokeWidth="2.5" 
      strokeLinejoin="round"
    />
    <path d="M20 10L23 20H17L20 10Z" className="fill-primary-500" />
    <path d="M20 30L17 20H23L20 30Z" className="fill-slate-500" />
    <circle cx="20" cy="20" r="1.5" className="fill-slate-900" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* 4 COLUMNS LAYOUT */}
        {/* Desktop: Logo (left, wide) | GAP-16 | O serwisie | Na skróty | Informacje (close together) */}
        {/* Mobile: Stack vertically */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,350px)_1fr] gap-12 md:gap-16">
            
            {/* COLUMN 1: Logo + Description + Email - LEFT SIDE */}
            <div className="md:pr-8 md:border-r md:border-slate-800">
              <div className="flex items-center gap-4 mb-6">
                <FooterLogo />
                <div className="flex flex-col">
                  <span className="font-serif text-2xl font-bold text-white leading-none">Kompas</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 leading-none mt-1">Seniora</span>
                </div>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Twój rzetelny przewodnik po systemie opieki senioralnej. Łączymy sprawdzone dane z ludzkim podejściem, aby ułatwić rodzinom najtrudniejsze decyzje.
              </p>

              <a 
                href="mailto:kontakt@kompaseniora.pl" 
                className="inline-flex items-center gap-2 text-white hover:text-primary-400 transition-colors text-sm font-bold"
              >
                <Mail size={16} />
                kontakt@kompaseniora.pl
              </a>
            </div>

            {/* COLUMNS 2-4: O serwisie, Na skróty, Informacje - RIGHT SIDE (close together) */}
            <div className="grid grid-cols-3 gap-6 md:gap-8">
              
              {/* O serwisie */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-serif font-bold mb-4 text-primary-400">
                  O serwisie
                </h3>
                <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <li>
                    <Link href="/misja" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Misja
                    </Link>
                  </li>
                  <li>
                    <Link href="/kontakt" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Kontakt
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-slate-300 hover:text-primary-400 transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Na skróty */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-serif font-bold mb-4 text-primary-400">
                  Na skróty
                </h3>
                <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <li>
                    <Link href="/search" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Wyszukiwarka
                    </Link>
                  </li>
                  <li>
                    <Link href="/ulubione" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Ulubione
                    </Link>
                  </li>
                  <li>
                    <Link href="/kalkulator" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Kalkulator
                    </Link>
                  </li>
                  <li>
                    <Link href="/knowledge" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Poradniki
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Informacje */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-serif font-bold mb-4 text-primary-400">
                  Informacje
                </h3>
                <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <li>
                    <Link href="/polityka-prywatnosci" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Polityka Prywatności
                    </Link>
                  </li>
                  <li>
                    <Link href="/regulamin" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Regulamin
                    </Link>
                  </li>
                  <li>
                    <Link href="/polityka-cookies" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Polityka Cookies
                    </Link>
                  </li>
                  <li>
                    <Link href="/mapa-strony" className="text-slate-300 hover:text-primary-400 transition-colors">
                      Mapa strony
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-slate-800 pt-8">
          <div className="text-center text-xs md:text-sm text-slate-400">
            <p>
              © {currentYear} <span className="text-primary-400 font-bold">Kompas Seniora</span> - Wspieramy cyfryzację pomocy społecznej w Polsce
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}