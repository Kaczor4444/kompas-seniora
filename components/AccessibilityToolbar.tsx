'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import {
  X, ChevronLeft, ChevronRight, RotateCcw,
  Type, Link2, ZapOff, MoveVertical, MoveHorizontal,
  MousePointer2, ImageOff, AlignLeft, Droplet,
  ArrowUpFromLine, MessageSquare,
} from 'lucide-react';

interface AccessibilitySettings {
  isHighContrast: boolean;
  isLargeFont: boolean;
  linksUnderlined: boolean;
  reduceMotion: boolean;
  dyslexiaFriendly: boolean;
  textSpacing: boolean;
  hideImages: boolean;
  bigCursor: boolean;
  lineHeight: boolean;
  textAlignLeft: boolean;
  saturation: boolean;
  tooltips: boolean;
}

interface Props {
  settings: AccessibilitySettings;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
  resetSettings: () => void;
  onClose: () => void;
}

const TILES: Array<{
  key: keyof AccessibilitySettings;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}> = [
  {
    key: 'isHighContrast',
    label: 'Kontrast',
    icon: <Image src="/images/logo_dostepnosc.webp" alt="" width={16} height={16} />,
    activeClass: 'bg-amber-500 text-white border-amber-600',
  },
  {
    key: 'isLargeFont',
    label: 'Większy tekst',
    icon: <Type size={16} />,
    activeClass: 'bg-blue-500 text-white border-blue-600',
  },
  {
    key: 'linksUnderlined',
    label: 'Linki',
    icon: <Link2 size={16} />,
    activeClass: 'bg-emerald-500 text-white border-emerald-600',
  },
  {
    key: 'textSpacing',
    label: 'Odstępy',
    icon: <MoveHorizontal size={16} />,
    activeClass: 'bg-violet-500 text-white border-violet-600',
  },
  {
    key: 'reduceMotion',
    label: 'Stop animacje',
    icon: <ZapOff size={16} />,
    activeClass: 'bg-orange-500 text-white border-orange-600',
  },
  {
    key: 'hideImages',
    label: 'Ukryj obrazy',
    icon: <ImageOff size={16} />,
    activeClass: 'bg-red-500 text-white border-red-600',
  },
  {
    key: 'dyslexiaFriendly',
    label: 'Dysleksja',
    icon: <MoveVertical size={16} />,
    activeClass: 'bg-teal-500 text-white border-teal-600',
  },
  {
    key: 'bigCursor',
    label: 'Duży kursor',
    icon: <MousePointer2 size={16} />,
    activeClass: 'bg-pink-500 text-white border-pink-600',
  },
  {
    key: 'tooltips',
    label: 'Podpowiedzi',
    icon: <MessageSquare size={16} />,
    activeClass: 'bg-indigo-500 text-white border-indigo-600',
  },
  {
    key: 'lineHeight',
    label: 'Interlinia',
    icon: <ArrowUpFromLine size={16} />,
    activeClass: 'bg-lime-600 text-white border-lime-700',
  },
  {
    key: 'textAlignLeft',
    label: 'Wyrównanie',
    icon: <AlignLeft size={16} />,
    activeClass: 'bg-cyan-500 text-white border-cyan-600',
  },
  {
    key: 'saturation',
    label: 'Monochrom',
    icon: <Droplet size={16} />,
    activeClass: 'bg-slate-500 text-white border-slate-600',
  },
];

export default function AccessibilityToolbar({
  settings,
  toggleSetting,
  resetSettings,
  onClose,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  const activeCount = TILES.filter(t => settings[t.key]).length;
  const hc = settings.isHighContrast;

  return (
    <div
      data-a11y-toolbar
      className={`hidden md:flex items-center h-16 border-b px-4 gap-2
        ${hc ? 'bg-black border-yellow-400' : 'bg-slate-800 border-slate-700'}`}
    >
      {/* Logo + label */}
      <div className={`flex items-center gap-2 shrink-0 pr-3 border-r
        ${hc ? 'border-yellow-400' : 'border-slate-600'}`}>
        <Image
          src="/images/logo_dostepnosc.webp"
          alt="Dostępność"
          width={26}
          height={26}
        />
        <span className={`text-sm font-semibold whitespace-nowrap hidden lg:block
          ${hc ? 'text-yellow-400' : 'text-slate-200'}`}>
          Dostępność
        </span>
      </div>

      {/* Scroll left */}
      <button
        onClick={() => scroll('left')}
        className={`shrink-0 p-1.5 rounded-sm transition-colors
          ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Przewiń w lewo"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Scrollable tile row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto flex-1 items-center"
        style={{ scrollbarWidth: 'none' }}
      >
        {TILES.map(({ key, label, icon, activeClass }) => {
          const isActive = settings[key];
          return (
            <button
              key={key}
              onClick={() => toggleSetting(key)}
              title={label}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 border
                ${isActive
                  ? hc
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-sm'
                    : `${activeClass} shadow-sm`
                  : hc
                    ? 'bg-transparent text-white border-yellow-400/60 hover:bg-gray-900 hover:border-yellow-400'
                    : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600'
                }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll right */}
      <button
        onClick={() => scroll('right')}
        className={`shrink-0 p-1.5 rounded-sm transition-colors
          ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Przewiń w prawo"
      >
        <ChevronRight size={18} />
      </button>

      {/* Right controls */}
      <div className={`flex items-center gap-1.5 shrink-0 pl-4 border-l
        ${hc ? 'border-yellow-400' : 'border-slate-600'}`}>
        <button
          onClick={resetSettings}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-colors
            ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Resetuj ustawienia"
        >
          <RotateCcw size={15} />
          <span className="hidden xl:block">Resetuj</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={onClose}
          className={`p-2 rounded-sm transition-colors
            ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Zamknij pasek dostępności"
          aria-label="Zamknij pasek dostępności"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
