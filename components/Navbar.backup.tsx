'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  CalculatorIcon,
  BookOpenIcon,
  EnvelopeIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

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
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </Link>
            
            {/* Desktop Navigation */}
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
              
              <button className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <EnvelopeIcon className="w-5 h-5" />
                Kontakt
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-1.5 border-2 border-accent-500 text-accent-600 rounded-lg font-semibold hover:bg-accent-50 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
              <span className="text-base">MENU</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
}