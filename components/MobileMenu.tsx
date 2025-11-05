'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  BookOpenIcon,
  EnvelopeIcon,
  XMarkIcon,
  PhoneIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { getFavoritesCount } from '@/src/utils/favorites';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Initialize favorites count
  useEffect(() => {
    setFavoritesCount(getFavoritesCount());
  }, []);

  // Listen for favorites changes
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

  // Delay rendering for smooth animation
  useEffect(() => {
    if (isOpen) {
      // Small delay before showing menu
      const timer = setTimeout(() => setShouldRender(true), 50);
      return () => clearTimeout(timer);
    } else {
      // Immediate hide on close
      setShouldRender(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: '/', label: 'Strona główna', icon: HomeIcon },
    { href: '/search', label: 'Wyszukiwarka', icon: MagnifyingGlassIcon },
    { href: '/ulubione', label: 'Ulubione', icon: HeartIcon },
    { href: '#kalkulator', label: 'Kalkulator', icon: CalculatorIcon },
    { href: '#poradnik', label: 'Poradnik', icon: BookOpenIcon },
    { href: '/kontakt', label: 'Kontakt', icon: EnvelopeIcon },
  ];

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-500 ${
          shouldRender ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      {/* Dropdown Menu Panel - STICKY zamiast FIXED */}
      <div 
        className={`sticky left-0 right-0 z-50 md:hidden bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-out rounded-b-2xl ${
          shouldRender ? 'top-0 max-h-screen opacity-100' : 'top-0 max-h-0 opacity-0'
        }`}
        style={{
          transformOrigin: 'top',
        }}
      >
        {/* Menu Items */}
        <nav className="overflow-y-auto max-h-[calc(100vh-73px)]">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  // ✅ DODANE: Zapisz URL przed odejściem (tylko dla Ulubione)
                  if (item.href === '/ulubione' && typeof window !== 'undefined') {
                    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
                  }
                  onClose();
                }}
                className={`
                  flex items-center gap-4 px-6 py-4
                  text-base font-medium
                  border-b border-neutral-100
                  transition-all duration-200
                  relative
                  ${active 
                    ? 'bg-accent-50 text-accent-700 border-l-4 border-accent-500' 
                    : 'text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100'
                  }
                  ${shouldRender ? `animate-slideDown` : ''}
                `}
                style={{
                  animationDelay: shouldRender ? `${index * 80}ms` : '0ms',
                }}
              >
                <Icon className={`w-6 h-6 flex-shrink-0 ${active ? 'text-accent-600' : 'text-neutral-600'}`} />
                <span>{item.label}</span>
                
                {/* Badge dla Ulubione */}
                {item.href === '/ulubione' && favoritesCount > 0 && (
                  <span className="ml-auto bg-accent-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
                
                {/* Checkmark dla aktywnej strony */}
                {active && item.href !== '/ulubione' && (
                  <span className="ml-auto text-xs text-accent-600 font-normal">
                    ✓
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}