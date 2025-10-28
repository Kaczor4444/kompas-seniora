'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  BookOpenIcon,
  EnvelopeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: '/', label: 'Strona główna', icon: HomeIcon },
    { href: '/search', label: 'Wyszukiwarka', icon: MagnifyingGlassIcon },
    { href: '#kalkulator', label: 'Kalkulator', icon: CalculatorIcon },
    { href: '#poradnik', label: 'Poradnik', icon: BookOpenIcon },
    { href: '#kontakt', label: 'Kontakt', icon: EnvelopeIcon },
  ];

  return (
    <div 
      className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        // Close when clicking backdrop (not on menu items)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Menu panel sliding from right */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto rounded-l-2xl transform transition-all duration-500 ease-in-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h2 className="text-xl font-bold text-neutral-900">MENU</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Zamknij menu"
        >
          <XMarkIcon className="w-6 h-6 text-neutral-700" />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-4 px-6 py-5 
                text-lg font-medium
                border-b border-neutral-100
                transition-colors
                ${active 
                  ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500' 
                  : 'text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100'
                }
              `}
            >
              <Icon className={`w-6 h-6 flex-shrink-0 ${active ? 'text-accent-600' : 'text-neutral-600'}`} />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto text-sm text-accent-600 font-normal">
                  ← Jesteś tutaj
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with Quick Actions (optional) */}
      <div className="border-t border-neutral-200 mt-4 pt-6 px-6 pb-8">
        <p className="text-sm text-neutral-500 mb-3 font-medium">SZYBKI KONTAKT:</p>
        <div className="space-y-3">
          <a 
            href="tel:+48123456789" 
            className="flex items-center gap-3 text-base text-neutral-700 hover:text-accent-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>+48 123 456 789</span>
          </a>
          <a 
            href="mailto:kontakt@kompaseniora.pl" 
            className="flex items-center gap-3 text-base text-neutral-700 hover:text-accent-600 transition-colors break-all"
          >
            <EnvelopeIcon className="w-5 h-5 flex-shrink-0" />
            <span>kontakt@kompaseniora.pl</span>
          </a>
        </div>
      </div>

      {/* Close Button at Bottom */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4">
        <button
          onClick={onClose}
          className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg font-semibold text-base transition-colors flex items-center justify-center gap-2"
        >
          <XMarkIcon className="w-5 h-5" />
          Zamknij menu
        </button>
      </div>
      </div>
    </div>
  );
}