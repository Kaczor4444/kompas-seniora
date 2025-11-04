'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  CalculatorIcon,
  BookOpenIcon,
  EnvelopeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import MobileMenu from './MobileMenu';
import { getFavoritesCount } from '@/src/utils/favorites';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    setFavoritesCount(getFavoritesCount());
  }, []);

  useEffect(() => {
    const handleFavoritesChange = () => {
      setFavoritesCount(getFavoritesCount());
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    window.addEventListener('storage', handleFavoritesChange);

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
      window.removeEventListener('storage', handleFavoritesChange);
    };
  }, []);

  return (
    <>
      <nav 
        className="border-b border-neutral-200 bg-white sticky top-0 z-50"
        style={{
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/search" 
                className={`flex items-center gap-2 font-medium transition-colors ${
                  isActive('/search') 
                    ? 'text-accent-600' 
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Wyszukiwarka
              </Link>

              {/* ✅ ZMIENIONE: Dodano onClick z sessionStorage */}
              <Link 
                href="/ulubione"
                onClick={() => {
                  // Zapisz obecny URL przed odejściem (desktop)
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
                  }
                }}
                className={`flex items-center gap-2 font-medium transition-colors relative ${
                  isActive('/ulubione') 
                    ? 'text-accent-600' 
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <HeartIcon className="w-5 h-5" />
                <span>Ulubione</span>
                {favoritesCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>
              
              <a 
                href="#kalkulator" 
                className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <CalculatorIcon className="w-5 h-5" />
                Kalkulator
              </a>
              
              <a 
                href="#poradnik" 
                className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <BookOpenIcon className="w-5 h-5" />
                Poradnik
              </a>
              
              <a 
                href="#kontakt" 
                className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5" />
                Kontakt
              </a>
            </div>

            {/* Mobile menu button - ANIMATED HAMBURGER */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors relative w-10 h-10"
              aria-label={isMobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
            >
              <div className="flex flex-col justify-center items-center w-full h-full">
                {/* Top line */}
                <span 
                  className={`block w-6 h-0.5 bg-neutral-700 rounded-full transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen 
                      ? 'rotate-45 translate-y-[0.4rem]' 
                      : 'rotate-0 translate-y-0'
                  }`}
                />
                {/* Middle line */}
                <span 
                  className={`block w-6 h-0.5 bg-neutral-700 rounded-full my-1 transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen 
                      ? 'opacity-0 scale-0' 
                      : 'opacity-100 scale-100'
                  }`}
                />
                {/* Bottom line */}
                <span 
                  className={`block w-6 h-0.5 bg-neutral-700 rounded-full transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen 
                      ? '-rotate-45 -translate-y-[0.4rem]' 
                      : 'rotate-0 translate-y-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
}