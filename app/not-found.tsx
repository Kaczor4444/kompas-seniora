import Link from 'next/link';
import { Home, Search, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Top decorative bar */}
          <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"></div>

          <div className="p-8 sm:p-12 lg:p-16">

            {/* 404 Badge */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-6xl font-black text-emerald-600 tracking-tighter">404</span>
                </div>
                {/* Decorative corner accent */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-600 rounded-lg opacity-20"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-emerald-400 rounded-md opacity-30"></div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 text-center tracking-tighter">
              Ojej! Zgubiliśmy się
            </h1>

            {/* Subheading with underline decoration */}
            <div className="text-center mb-8">
              <p className="text-xl text-slate-600 mb-2">
                Strona, której szukasz nie istnieje
              </p>
              <div className="flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"></div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-500 text-center leading-relaxed max-w-2xl mx-auto mb-12">
              Możliwe, że strona została przeniesiona, usunięta lub po prostu wpisano błędny adres.
              Nie martw się – pomożemy Ci wrócić na właściwą ścieżkę.
            </p>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

              {/* Primary CTA - Home */}
              <Link
                href="/"
                className="group bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl p-6 transition-all active:scale-95 flex flex-col items-center gap-3 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Home className="w-6 h-6" />
                </div>
                <span className="font-black text-sm uppercase tracking-[0.15em]">Strona główna</span>
              </Link>

              {/* Secondary CTA - Search */}
              <Link
                href="/search"
                className="group bg-slate-900 hover:bg-slate-800 text-white rounded-xl p-6 transition-all active:scale-95 flex flex-col items-center gap-3 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-emerald-600 transition-all">
                  <Search className="w-6 h-6" />
                </div>
                <span className="font-black text-sm uppercase tracking-[0.15em]">Wyszukaj DPS</span>
              </Link>

              {/* Tertiary CTA - Map */}
              <Link
                href="/search?view=map"
                className="group bg-white hover:bg-slate-50 text-slate-900 rounded-xl p-6 transition-all active:scale-95 flex flex-col items-center gap-3 border-2 border-slate-200 hover:border-emerald-400"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-all">
                  <MapPin className="w-6 h-6 text-slate-600 group-hover:text-emerald-600 transition-all" />
                </div>
                <span className="font-black text-sm uppercase tracking-[0.15em]">Zobacz mapę</span>
              </Link>

            </div>

            {/* Footer help text */}
            <div className="text-center pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-400">
                Potrzebujesz pomocy? Sprawdź naszą{' '}
                <Link href="/faq" className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2">
                  sekcję FAQ
                </Link>
                {' '}lub{' '}
                <Link href="/kontakt" className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2">
                  skontaktuj się z nami
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Bottom decorative element - compass illustration */}
        <div className="mt-8 flex justify-center opacity-40">
          <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12l3-6-6 3 3 6 6-3-3-6z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        </div>

      </div>
    </div>
  );
}
