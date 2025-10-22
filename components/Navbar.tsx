'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/search" className="text-neutral-700 hover:text-neutral-900 font-medium">
              Wyszukiwarka
            </Link>
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
  );
}
