'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Calculator, BookOpen, Menu, X, ChevronDown, Mail, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { getFavoritesCount } from '@/src/utils/favorites';
import { AccessibilityPanel } from './AccessibilityPanel';

const AccessibilityIcon = ({ className }: { className?: string }) => (
  <Image
    src="/images/logo_dostepnosc.webp"
    alt="Dostępność"
    width={44}
    height={44}
    className={className}
  />
);

const NavbarLogo = () => (
  <Image
    src="/images/logo1.png"
    alt="Kompas Seniora Logo"
    width={200}
    height={60}
    className="h-10 w-auto"
  />
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isGuidesHovered, setIsGuidesHovered] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    isHighContrast: false,
    isLargeFont: false,
    linksUnderlined: false,
    reduceMotion: false,
    dyslexiaFriendly: false,
    textSpacing: false,
    hideImages: false,
    bigCursor: false,
    lineHeight: false,
    textAlignLeft: false,
    saturation: false,
    tooltips: false,
  });

  // Load accessibility settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        setAccessibilitySettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }
  }, []);

  // Save accessibility settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(accessibilitySettings));
  }, [accessibilitySettings]);

  const pathname = usePathname();
  const lastScrollY = useRef(0);

  const isActive = (path: string) => pathname === path;

  // Favorites count logic
  useEffect(() => {
    setFavoritesCount(getFavoritesCount());

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

  // Scroll progress and auto-hide logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY);
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - windowHeight;

      if (maxScroll > 0) {
        const progress = currentScrollY / maxScroll;
        setScrollProgress(Math.min(Math.max(progress, 0), 1));
      } else {
        setScrollProgress(0);
      }

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else {
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;

      // Progress bar visibility during scrolling
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1500); // Hide after 1.5s of no scrolling
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Block body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      // Blokada scrollu - działa na iOS Safari
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Close menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const isNavbarVisible = isOpen || isVisible;

  const guideCategories = [
    "Wybór opieki",
    "Dla opiekuna",
    "Dla seniora",
    "Finanse",
    "Prawne"
  ];

  // Accessibility functions
  const toggleSetting = (key: keyof typeof accessibilitySettings) => {
    setAccessibilitySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetSettings = () => {
    setAccessibilitySettings({
      isHighContrast: false,
      isLargeFont: false,
      linksUnderlined: false,
      reduceMotion: false,
      dyslexiaFriendly: false,
      textSpacing: false,
      hideImages: false,
      bigCursor: false,
      lineHeight: false,
      textAlignLeft: false,
      saturation: false,
      tooltips: false,
    });
  };

  // Alias for backward compatibility with existing code
  const isHighContrast = accessibilitySettings.isHighContrast;

  // Apply accessibility settings globally to body element
  useEffect(() => {
    const body = document.body;

    // High Contrast
    body.classList.toggle('accessibility-high-contrast', accessibilitySettings.isHighContrast);

    // Large Font
    body.classList.toggle('accessibility-large-font', accessibilitySettings.isLargeFont);

    // Links Underlined
    body.classList.toggle('accessibility-links-underlined', accessibilitySettings.linksUnderlined);

    // Reduce Motion
    body.classList.toggle('accessibility-reduce-motion', accessibilitySettings.reduceMotion);

    // Dyslexia Friendly
    body.classList.toggle('accessibility-dyslexia-friendly', accessibilitySettings.dyslexiaFriendly);

    // Text Spacing
    body.classList.toggle('accessibility-text-spacing', accessibilitySettings.textSpacing);

    // Hide Images
    body.classList.toggle('accessibility-hide-images', accessibilitySettings.hideImages);

    // Big Cursor
    body.classList.toggle('accessibility-big-cursor', accessibilitySettings.bigCursor);

    // Line Height
    body.classList.toggle('accessibility-line-height', accessibilitySettings.lineHeight);

    // Text Align Left
    body.classList.toggle('accessibility-text-align-left', accessibilitySettings.textAlignLeft);

    // Saturation (Monochrome)
    body.classList.toggle('accessibility-saturation', accessibilitySettings.saturation);

    // Tooltips
    body.classList.toggle('accessibility-tooltips', accessibilitySettings.tooltips);
  }, [accessibilitySettings]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b shadow-sm transition-transform duration-300 ease-in-out
        ${isHighContrast ? 'bg-black border-yellow-400' : 'bg-white/95 border-stone-100'}
        ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
        `}
        onMouseLeave={() => setIsGuidesHovered(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center relative">

            {/* LEFT: Hamburger (mobile) | Logo (desktop) */}
            <div className="flex items-center">
              {/* Mobile hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`md:hidden p-2 rounded-xl ${isHighContrast ? 'text-yellow-400' : 'text-slate-700'}`}
                aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>

              {/* Desktop logo - ze skalowaniem */}
              <Link href="/" className="hidden md:flex flex-shrink-0 items-center md:mr-2 lg:mr-4 group">
                <div className="md:scale-75 lg:scale-100 origin-left transition-transform">
                  <NavbarLogo />
                </div>
              </Link>
            </div>

            {/* Mobile logo - absolutnie wyśrodkowane */}
            <Link href="/" className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center group">
              <NavbarLogo />
            </Link>

            {/* Desktop Menu - z responsywnym spacingiem */}
            <div className="hidden md:flex md:space-x-0.5 lg:space-x-1 xl:space-x-3 items-center mx-auto h-full">
              <Link href="/search">
                <NavLink isHighContrast={isHighContrast} icon={<Search size={18} />} text="Wyszukiwarka" isActive={isActive('/search')} />
              </Link>

              <Link href="/kalkulator">
                <NavLink isHighContrast={isHighContrast} icon={<Calculator size={18} />} text="Kalkulator" isActive={isActive('/kalkulator')} />
              </Link>

              <Link href="/asystent">
                <NavLink isHighContrast={isHighContrast} icon={<Sparkles size={18} />} text="Asystent" isActive={isActive('/asystent')} />
              </Link>

              <Link
                href="/ulubione"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
                  }
                }}
              >
                <NavLink isHighContrast={isHighContrast} icon={<Heart size={18} />} text="Ulubione" badge={favoritesCount > 0 ? favoritesCount.toString() : undefined} isActive={isActive('/ulubione')} />
              </Link>

              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsGuidesHovered(true)}
                onMouseLeave={() => setIsGuidesHovered(false)}
              >
                <Link
                  href="/poradniki"
                  className={`flex items-center md:gap-1.5 lg:gap-2 font-bold transition-all md:px-2 lg:px-3 xl:px-4 md:py-1.5 lg:py-2 xl:py-2.5 rounded-xl relative z-10 group whitespace-nowrap
                  ${isHighContrast
                      ? (isActive('/poradniki') ? 'bg-yellow-400 text-black font-bold' : 'text-white hover:text-yellow-400')
                      : (isActive('/poradniki') ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-slate-600 hover:text-primary-700 hover:bg-stone-100')
                  }`}
                >
                  <BookOpen size={18} className={`${isHighContrast ? '' : (isActive('/poradniki') ? 'text-primary-600' : 'text-primary-500')}`} />
                  <span className="md:text-xs lg:text-sm">Poradniki</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isGuidesHovered ? 'rotate-180' : ''}`} />
                </Link>

                <div
                  className={`absolute top-full left-0 w-60 pt-2 transition-all duration-300 origin-top-left
                  ${isGuidesHovered ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}
                >
                  <div className={`rounded-xl shadow-2xl border overflow-hidden p-2.5 ${isHighContrast ? 'bg-black border-yellow-400' : 'bg-white border-stone-100'}`}>
                    {guideCategories.map((cat, idx) => (
                      <Link
                        key={idx}
                        href={`/poradniki?category=${encodeURIComponent(cat)}#filtry`}
                        onClick={() => setIsGuidesHovered(false)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group
                          ${isHighContrast
                            ? 'text-white hover:bg-yellow-400 hover:text-black'
                            : 'text-slate-600 hover:bg-stone-100 hover:text-primary-700'
                          }`}
                      >
                        {cat}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Accessibility + Mail/Kontakt (mobile i desktop) */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setIsAccessibilityPanelOpen(!isAccessibilityPanelOpen)}
                className={`flex w-9 h-9 md:w-10 md:h-10 rounded-full items-center justify-center transition-all group
                  ${isHighContrast
                    ? 'bg-yellow-400 text-black'
                    : 'hover:bg-primary-50/30'
                  }`}
                title="Dostępność"
                aria-label="Otwórz panel dostępności"
              >
                <AccessibilityIcon className="w-7 h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
              </button>

              <Link
                href="/kontakt"
                className={`hidden md:flex items-center md:gap-1.5 lg:gap-2 transition-all rounded-xl
                  md:px-2 lg:px-3 xl:px-4 md:py-1.5 lg:py-2 xl:py-2.5 whitespace-nowrap
                  ${isHighContrast
                    ? (isActive('/kontakt') ? 'bg-yellow-400 text-black' : 'text-yellow-400 hover:underline')
                    : (isActive('/kontakt') ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:text-primary-600 hover:bg-stone-50')
                  }`}
              >
                <span className="flex items-center md:gap-1 lg:gap-2 font-black uppercase md:tracking-wider lg:tracking-widest md:text-[9px] lg:text-[11px]">
                  <Mail size={16} className="md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                  Kontakt
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Backdrop overlay for mobile menu */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar - slides from left */}
        <div className={`fixed top-0 left-0 h-screen w-[85vw] max-w-md shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isHighContrast ? 'bg-black' : 'bg-white'}`}>

          {/* Header with close button */}
          <div className={`p-4 border-b flex justify-between items-center ${isHighContrast ? 'border-yellow-400 bg-black' : 'border-stone-200 bg-white'}`}>
            <h2 className={`text-xl font-black ${isHighContrast ? 'text-yellow-400' : 'text-slate-900'}`}>
              Menu
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 rounded-full transition-colors ${isHighContrast ? 'hover:bg-yellow-400 hover:text-black text-yellow-400' : 'hover:bg-stone-100 text-slate-500'}`}
              aria-label="Zamknij menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className={`flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-2 ${isHighContrast ? 'bg-black' : 'bg-white'}`}>
              <Link href="/search" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<Search size={20} />} text="Wyszukiwarka" isActive={isActive('/search')} />
              </Link>

              <Link href="/kalkulator" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<Calculator size={20} />} text="Kalkulator" isActive={isActive('/kalkulator')} />
              </Link>

              <Link href="/asystent" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<Sparkles size={20} />} text="Asystent" isActive={isActive('/asystent')} />
              </Link>

              <Link
                href="/ulubione"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
                  }
                  setIsOpen(false);
                }}
                className="w-full block"
              >
                <MobileNavLink isHighContrast={isHighContrast} icon={<Heart size={20} />} text="Ulubione" badge={favoritesCount > 0 ? favoritesCount.toString() : undefined} isActive={isActive('/ulubione')} />
              </Link>

              {/* Poradniki - główny link */}
              <Link href="/poradniki" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<BookOpen size={20} />} text="Poradniki" isActive={isActive('/poradniki')} />
              </Link>

              {/* Subkategorie poradników - wcięte małe linki */}
              <div className={`pl-8 space-y-1 ${isHighContrast ? 'border-l-2 border-yellow-400 ml-2' : 'border-l-2 border-stone-200 ml-2'}`}>
                {guideCategories.map((cat, idx) => (
                  <Link
                    key={idx}
                    href={`/poradniki?category=${encodeURIComponent(cat)}#filtry`}
                    onClick={() => setIsOpen(false)}
                    className={`block py-1.5 px-3 text-sm rounded-lg transition-colors ${
                      isHighContrast
                        ? 'text-yellow-400 hover:bg-yellow-400 hover:text-black'
                        : 'text-slate-600 hover:bg-stone-50 hover:text-primary-600'
                    }`}
                  >
                    • {cat}
                  </Link>
                ))}
              </div>

              <div className={`my-3 border-t ${isHighContrast ? 'border-yellow-400' : 'border-stone-100'}`}></div>

              <Link
                href="/kontakt"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                  isHighContrast
                    ? (isActive('/kontakt') ? 'bg-yellow-400 text-black' : 'text-white hover:bg-yellow-400 hover:text-black')
                    : (isActive('/kontakt') ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-700 hover:bg-stone-50 hover:text-primary-600')
                }`}
              >
                <Mail size={20} />
                <span className="font-bold">Kontakt bezpośredni</span>
              </Link>

          </div>
        </div>
      </nav>

      {/* Progress Bar with shadow */}
      {/* Desktop: UKRYTY (w artykułach jest ReadingProgressBar) */}
      {/* Mobile: Widoczny podczas scrollu WSZĘDZIE (jeden uniwersalny pasek) */}
      <div
        className={`fixed left-0 w-full h-1 z-[45] transition-all duration-300 ease-in-out
        ${isHighContrast ? 'bg-slate-800' : 'bg-stone-100'}
        ${isNavbarVisible ? 'top-20' : 'top-0'}
        md:hidden ${isScrolling ? 'block' : 'hidden'}`}
      >
        <div
          className={`h-full transition-all duration-150 ease-linear shadow-[0_0_12px_rgba(5,150,105,0.4)] ${
            isHighContrast
              ? 'bg-yellow-400'
              : 'bg-primary-600'
          }`}
          style={{ width: `${scrollProgress * 100}%` }}
        ></div>
      </div>

      {/* Full Accessibility Panel */}
      <AccessibilityPanel
        isOpen={isAccessibilityPanelOpen}
        onClose={() => setIsAccessibilityPanelOpen(false)}
        settings={accessibilitySettings}
        toggleSetting={toggleSetting}
        resetSettings={resetSettings}
      />
    </>
  );
}

const NavLink = ({ icon, text, badge, isHighContrast, isActive }: { icon: React.ReactNode; text: string; badge?: string; isHighContrast: boolean; isActive?: boolean }) => (
  <div className={`flex items-center md:gap-1.5 lg:gap-2.5 font-bold transition-all relative group md:px-2 lg:px-3 xl:px-4 md:py-1.5 lg:py-2 xl:py-2.5 rounded-xl md:text-xs lg:text-sm whitespace-nowrap
    ${isHighContrast
      ? (isActive ? 'bg-yellow-400 text-black' : 'text-white hover:text-yellow-400')
      : (isActive ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-slate-600 hover:text-primary-700 hover:bg-stone-100')
    }`}>
    <span className={`transition-all duration-300 ${isHighContrast ? '' : (isActive ? 'text-primary-600' : 'text-primary-500 group-hover:scale-110')}`}>{icon}</span>
    {text}
    {badge && (
      <span className={`absolute top-0 right-0 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 transform translate-x-1/4 -translate-y-1/4 ${isHighContrast ? 'bg-yellow-400 text-black border-black' : 'bg-primary-600 text-white border-white shadow-sm'}`}>
        {badge}
      </span>
    )}
  </div>
);

const MobileNavLink = ({ icon, text, badge, isHighContrast, isActive }: { icon: React.ReactNode; text: string; badge?: string; isHighContrast: boolean; isActive?: boolean }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
    isHighContrast
      ? (isActive ? 'bg-yellow-400 text-black' : 'text-white hover:bg-yellow-400 hover:text-black')
      : (isActive ? 'bg-primary-100 text-primary-700 font-bold border border-primary-200 shadow-sm' : 'text-slate-700 hover:bg-stone-100 hover:text-primary-600 border border-transparent')
  }`}>
    {icon}
    <span className="font-bold">{text}</span>
    {badge && (
      <span className={`ml-auto text-[10px] font-black px-2 py-1 rounded-full ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-primary-600 text-white shadow-inner'}`}>
        {badge}
      </span>
    )}
  </div>
);
