'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, Calculator, BookOpen, Menu, X, ChevronDown, Mail, ChevronRight, Sparkles } from 'lucide-react';
import { getFavoritesCount } from '@/src/utils/favorites';
import { AccessibilityPanel } from './AccessibilityPanel';

const AccessibilityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8"/>
    <circle cx="50" cy="30" r="7" fill="currentColor"/>
    <path d="M50 40 L50 65 M50 42 L25 55 M50 42 L75 55 M50 65 L35 88 M50 65 L65 88" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeartCompassLogo = ({ isHighContrast }: { isHighContrast: boolean }) => (
  <div className="relative w-12 h-12 flex items-center justify-center group">
    {/* Classic Heart Icon */}
    <Heart
      size={40}
      className={`${isHighContrast ? 'text-yellow-400' : 'text-primary-600'} transition-transform duration-500 group-hover:scale-105`}
      strokeWidth={1.5}
    />

    {/* Compass Dial Dots */}
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 ${isHighContrast ? 'text-yellow-200' : 'text-slate-400'}`}>
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full" />
      <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full" />
      <div className="absolute left-[28%] top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-current rounded-full" />
      <div className="absolute right-[28%] top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-current rounded-full" />
    </div>

    {/* Long, Distinct 3D Needle - pointed at 13:00 and 19:00 */}
    <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out group-hover:rotate-[-8deg]">
      <svg viewBox="0 0 24 24" className="w-8 h-8 rotate-[30deg] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Upper Part (13:00) */}
        <path d="M12 1L14.5 12L12 12V1Z" fill={isHighContrast ? "#fef08a" : "#064e3b"} /> {/* Dark Emerald */}
        <path d="M12 1L9.5 12L12 12V1Z" fill={isHighContrast ? "#eab308" : "#334155"} />  {/* Dark Gray */}

        {/* Lower Part (19:00) */}
        <path d="M12 23L9.5 12L12 12V23Z" fill={isHighContrast ? "#eab308" : "#064e3b"} /> {/* Dark Emerald */}
        <path d="M12 23L14.5 12L12 12V23Z" fill={isHighContrast ? "#fef08a" : "#334155"} /> {/* Dark Gray */}

        {/* Central Pin */}
        <circle cx="12" cy="12" r="0.8" fill={isHighContrast ? "#000" : "#fff"} />
      </svg>
    </div>
  </div>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isGuidesHovered, setIsGuidesHovered] = useState(false);
  const [isMobileGuidesExpanded, setIsMobileGuidesExpanded] = useState(false);
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
          <div className="flex justify-between h-20 items-center">

            {/* Logo Section */}
            <Link href="/" className="flex-shrink-0 flex items-center mr-4 group">
              <HeartCompassLogo isHighContrast={isHighContrast} />
              <div className="flex flex-col ml-3">
                <div className={`font-serif text-xl md:text-2xl font-bold tracking-tight leading-none ${isHighContrast ? 'text-yellow-400' : 'text-slate-900'}`}>
                  Kompas
                </div>
                <div className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] mt-1.5 ml-0.5 ${isHighContrast ? 'text-yellow-200' : 'text-primary-700/80'}`}>
                  Seniora
                </div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-1 lg:space-x-3 items-center mx-auto h-full">
              <Link href="/search">
                <NavLink isHighContrast={isHighContrast} icon={<Search size={18} />} text="Wyszukiwarka" isActive={isActive('/search')} />
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

              <Link href="/asystent">
                <NavLink isHighContrast={isHighContrast} icon={<Sparkles size={18} />} text="Asystent" isActive={isActive('/asystent')} />
              </Link>

              <Link href="/kalkulator">
                <NavLink isHighContrast={isHighContrast} icon={<Calculator size={18} />} text="Kalkulator" isActive={isActive('/kalkulator')} />
              </Link>

              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsGuidesHovered(true)}
                onMouseLeave={() => setIsGuidesHovered(false)}
              >
                <Link
                  href="/poradniki"
                  className={`flex items-center gap-2 font-bold transition-all px-4 py-2.5 rounded-2xl relative z-10 group
                  ${isHighContrast
                      ? (isActive('/poradniki') ? 'bg-yellow-400 text-black font-bold' : 'text-white hover:text-yellow-400')
                      : (isActive('/poradniki') ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-600 hover:text-primary-700 hover:bg-stone-50')
                  }`}
                >
                  <BookOpen size={18} className={`${isHighContrast ? '' : (isActive('/poradniki') ? 'text-primary-600' : 'text-primary-500')}`} />
                  <span className="text-sm">Poradniki</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isGuidesHovered ? 'rotate-180' : ''}`} />
                </Link>

                <div
                  className={`absolute top-full left-0 w-60 pt-2 transition-all duration-300 origin-top-left
                  ${isGuidesHovered ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}
                >
                  <div className={`rounded-2xl shadow-2xl border overflow-hidden p-2.5 ${isHighContrast ? 'bg-black border-yellow-400' : 'bg-white border-stone-100'}`}>
                    {guideCategories.map((cat, idx) => (
                      <Link
                        key={idx}
                        href={`/poradniki?category=${encodeURIComponent(cat)}`}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group
                          ${isHighContrast
                            ? 'text-white hover:bg-yellow-400 hover:text-black'
                            : 'text-slate-600 hover:bg-stone-50 hover:text-primary-700'
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

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setIsAccessibilityPanelOpen(!isAccessibilityPanelOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all font-bold border ${isHighContrast ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-stone-50 text-slate-600 border-stone-200 hover:border-primary-300 hover:text-primary-700 hover:bg-white'}`}
                aria-label="Otwórz panel dostępności"
              >
                <AccessibilityIcon className="w-[18px] h-[18px]" />
                <span className="text-xs uppercase tracking-wider">Dostępność</span>
              </button>

              <Link
                href="/kontakt"
                className={`font-black uppercase tracking-widest text-[11px] flex items-center gap-2 transition-all px-4 py-2.5 rounded-2xl
                  ${isHighContrast
                    ? (isActive('/kontakt') ? 'bg-yellow-400 text-black' : 'text-yellow-400 hover:underline')
                    : (isActive('/kontakt') ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:text-primary-600 hover:bg-stone-50')
                  }`}
              >
                <Mail size={16} />
                Kontakt
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-2xl transition-all ${isHighContrast ? 'text-yellow-400' : 'bg-stone-100 text-slate-700 hover:text-primary-600'}`}
                aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className={`md:hidden border-t absolute w-full shadow-2xl h-[calc(100vh-80px)] overflow-y-auto ${isHighContrast ? 'bg-black border-yellow-400' : 'bg-white border-stone-100'}`}>
            <div className="px-4 pt-6 pb-12 space-y-3">
              <Link href="/search" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<Search size={20} />} text="Wyszukiwarka" isActive={isActive('/search')} />
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

              <Link href="/asystent" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<Sparkles size={20} />} text="Asystent" isActive={isActive('/asystent')} />
              </Link>

              <Link href="/kalkulator" onClick={() => setIsOpen(false)} className="w-full block">
                <MobileNavLink isHighContrast={isHighContrast} icon={<Calculator size={20} />} text="Kalkulator" isActive={isActive('/kalkulator')} />
              </Link>

              <div className={`rounded-2xl overflow-hidden transition-all border ${isMobileGuidesExpanded ? 'bg-stone-50 border-stone-200' : 'border-transparent'}`}>
                <button
                  onClick={() => setIsMobileGuidesExpanded(!isMobileGuidesExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${
                    isHighContrast
                      ? 'text-white hover:bg-yellow-400 hover:text-black'
                      : (isActive('/poradniki') ? 'text-primary-700 font-bold bg-primary-50' : 'text-slate-600 hover:text-primary-600')
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <BookOpen size={20} />
                    <span className="font-bold">Poradniki</span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform duration-300 ${isMobileGuidesExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isMobileGuidesExpanded && (
                  <div className={`pl-12 pr-4 pb-4 space-y-2 mt-2 border-l-2 ml-7 ${isHighContrast ? 'border-yellow-400' : 'border-primary-200'}`}>
                    {guideCategories.map((cat, idx) => (
                      <Link
                        key={idx}
                        href={`/poradniki?category=${encodeURIComponent(cat)}`}
                        onClick={() => setIsOpen(false)}
                        className={`w-full text-left py-2.5 px-3 text-sm font-bold rounded-xl block ${isHighContrast ? 'text-stone-300 hover:text-white' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-6 border-t border-stone-100"></div>

              <Link
                href="/kontakt"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                  isHighContrast
                    ? (isActive('/kontakt') ? 'bg-yellow-400 text-black' : 'text-white hover:bg-yellow-400 hover:text-black')
                    : (isActive('/kontakt') ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-700 hover:bg-stone-50 hover:text-primary-600')
                }`}
              >
                <Mail size={20} />
                <span className="font-bold">Kontakt bezpośredni</span>
              </Link>

              <div className="mt-8 pt-8 border-t border-stone-100">
                 <button
                    onClick={() => { setIsAccessibilityPanelOpen(!isAccessibilityPanelOpen); setIsOpen(false); }}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-full border-2 font-black uppercase text-[11px] tracking-widest ${isHighContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-primary-50 border-primary-100 text-primary-700 shadow-sm'}`}
                  >
                    <AccessibilityIcon className="w-[20px] h-[20px]" /> <span>Ułatwienia dostępu</span>
                 </button>
              </div>
            </div>
          </div>
        )}
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
  <div className={`flex items-center gap-2.5 font-bold transition-all relative group px-4 py-2.5 rounded-2xl text-sm
    ${isHighContrast
      ? (isActive ? 'bg-yellow-400 text-black' : 'text-white hover:text-yellow-400')
      : (isActive ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-600 hover:text-primary-700 hover:bg-stone-50')
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
  <div className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
    isHighContrast
      ? (isActive ? 'bg-yellow-400 text-black' : 'text-white hover:bg-yellow-400 hover:text-black')
      : (isActive ? 'bg-primary-50 text-primary-700 font-bold border border-primary-100 shadow-sm' : 'text-slate-700 hover:bg-stone-50 hover:text-primary-600 border border-transparent')
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
