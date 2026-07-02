'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  ChevronLeft, ChevronRight, RotateCcw,
  Type, Link2, ZapOff, MoveVertical, MoveHorizontal,
  MousePointer2, ImageOff, AlignLeft, Droplet,
  ArrowUpFromLine, MessageSquare, X, Volume2, ChevronDown, ChevronUp,
  Moon, Ruler, EyeOff, SkipBack, SkipForward,
} from 'lucide-react';
import type { TTSState } from '@/src/hooks/useTTS';

type FontType = 'normal' | 'sans' | 'serif' | 'dyslexia';

interface AccessibilitySettings {
  isHighContrast: boolean;
  linksUnderlined: boolean;
  textSpacing: boolean;
  reduceMotion: boolean;
  hideImages: boolean;
  bigCursor: boolean;
  tooltips: boolean;
  lineHeight: boolean;
  textAlignLeft: boolean;
  saturation: boolean;
  darkMode: boolean;
  readingRuler: boolean;
  screenMask: boolean;
}

interface Props {
  settings: AccessibilitySettings;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
  resetSettings: () => void;
  onClose: () => void;
  tts: TTSState;
  fontSizeLevel: number;
  setFontSizeLevel: (level: number) => void;
  fontType: FontType;
  setFontType: (type: FontType) => void;
}

const TILES: Array<{ key: keyof AccessibilitySettings; label: string; description: string; icon: React.ReactNode; color: string }> = [
  { key: 'isHighContrast',  label: 'Wysoki kontrast',   description: 'Zmienia kolory strony na czarno-białe dla lepszej czytelności',        icon: <Image src="/images/logo_dostepnosc.webp" alt="" width={22} height={22} className="invert brightness-200" />, color: 'bg-amber-500' },
  { key: 'darkMode',        label: 'Tryb ciemny',       description: 'Przyciemnia tło strony — wygodny do czytania przy słabym oświetleniu',  icon: <Moon size={21} />,           color: 'bg-slate-700' },
  { key: 'linksUnderlined', label: 'Podkreśl linki',    description: 'Podkreśla wszystkie odnośniki, ułatwiając ich rozpoznanie',            icon: <Link2 size={21} />,          color: 'bg-emerald-600' },
  { key: 'textSpacing',     label: 'Odstępy tekstu',    description: 'Zwiększa odstępy między literami i wyrazami',                          icon: <MoveHorizontal size={21} />, color: 'bg-blue-700' },
  { key: 'reduceMotion',    label: 'Stop animacje',     description: 'Wyłącza animacje i efekty ruchu na stronie',                          icon: <ZapOff size={21} />,         color: 'bg-orange-500' },
  { key: 'hideImages',      label: 'Ukryj obrazy',      description: 'Ukrywa zdjęcia i grafiki, pozostawiając tylko tekst',                 icon: <ImageOff size={21} />,       color: 'bg-red-500' },
  { key: 'readingRuler',   label: 'Linijka',            description: 'Poziomy pasek śledzący kursor — ułatwia śledzenie linii tekstu',      icon: <Ruler size={21} />,          color: 'bg-orange-600' },
  { key: 'screenMask',     label: 'Maska ekranu',       description: 'Przyciemnia stronę poza aktualnie czytaną linią',                     icon: <EyeOff size={21} />,         color: 'bg-gray-600' },
  { key: 'bigCursor',       label: 'Duży kursor',       description: 'Powiększa wskaźnik myszy dla łatwiejszego śledzenia',                  icon: <MousePointer2 size={21} />,  color: 'bg-slate-700' },
  { key: 'tooltips',        label: 'Podpowiedzi',       description: 'Wyświetla opisy elementów strony po najechaniu kursorem',             icon: <MessageSquare size={21} />,  color: 'bg-indigo-600' },
  { key: 'lineHeight',      label: 'Interlinia',        description: 'Zwiększa odstępy między wierszami tekstu',                            icon: <ArrowUpFromLine size={21} />,color: 'bg-lime-600' },
  { key: 'textAlignLeft',   label: 'Wyrównaj do lewej', description: 'Wyrównuje tekst do lewej zamiast justowania',                         icon: <AlignLeft size={21} />,      color: 'bg-cyan-600' },
  { key: 'saturation',      label: 'Monochromatyczny',  description: 'Usuwa kolory — wyświetla stronę w skali szarości',                    icon: <Droplet size={21} />,        color: 'bg-gray-500' },
];

const KEYBOARD_SHORTCUTS = [
  { action: 'Włącz/Wyłącz czytanie', keys: 'Ctrl + Alt + Z' },
  { action: 'Zatrzymaj czytanie',     keys: 'Ctrl + Alt + S' },
];

/* ── Portal tooltip for tiles inside overflow container ─────────── */
function Tip({ label, description }: { label: string; description?: string }) {
  return (
    <span className={`
      pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2
      px-2.5 py-1.5 rounded bg-gray-900 text-white text-[11px] z-[200]
      opacity-0 group-hover:opacity-100 transition-opacity duration-150
      before:content-[''] before:absolute before:bottom-full before:left-1/2
      before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-gray-900
      ${description ? 'w-48 text-left' : 'whitespace-nowrap'}
    `}>
      <span className="font-semibold block">{label}</span>
      {description && <span className="text-gray-300 text-[10px] block mt-0.5 leading-snug">{description}</span>}
    </span>
  );
}

function Tile({ onClick, label, description, icon, color, isActive, hc }: {
  onClick: () => void; label: string; description: string; icon: React.ReactNode;
  color: string; isActive: boolean; hc: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);

  const showTip = useCallback(() => {
    if (hc || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setTipPos({ top: r.bottom + 6, left: r.left + r.width / 2 });
  }, [hc]);

  const hideTip = useCallback(() => setTipPos(null), []);

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        onMouseEnter={showTip}
        onMouseLeave={hideTip}
        onClick={onClick}
        aria-label={label}
        aria-pressed={isActive}
        className={`w-10 h-10 flex items-center justify-center rounded text-white transition-all duration-150
          ${hc
            ? isActive ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            : `${color} ${isActive ? 'opacity-100 ring-2 ring-white ring-offset-1 ring-offset-gray-300' : 'opacity-60 hover:opacity-100'}`
          }`}
      >
        {icon}
      </button>
      {tipPos && createPortal(
        <span
          style={{ position: 'fixed', top: tipPos.top, left: tipPos.left, transform: 'translateX(-50%)', zIndex: 9999 }}
          className="pointer-events-none px-2.5 py-1.5 rounded bg-gray-900 text-white text-[11px] w-48 text-left shadow-lg"
        >
          <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid #111827' }} />
          <span className="font-semibold block">{label}</span>
          <span className="text-gray-300 text-[10px] block mt-0.5 leading-snug">{description}</span>
        </span>,
        document.body
      )}
    </div>
  );
}

/* ── Row helpers ─────────────────────────────────────────────────── */
function PanelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-[15px] font-medium text-gray-800">{label}</span>
      <div className="flex items-center gap-2 shrink-0 ml-4">{children}</div>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-7 h-7 flex items-center justify-center border-2 rounded transition-colors
        ${checked ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400 hover:border-gray-600'}`}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 4L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function RadioBtn({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors
        ${checked ? 'border-gray-800' : 'border-gray-400 hover:border-gray-600'}`}
    >
      {checked && <span className="w-4 h-4 rounded-full bg-gray-800 block" />}
    </button>
  );
}

/* ── TTS Panel ───────────────────────────────────────────────────── */
function TTSPanel({ tts, onClose }: { tts: TTSState; onClose: () => void }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const femaleVoices  = tts.voices.filter(v => v.gender === 'female');
  const maleVoices    = tts.voices.filter(v => v.gender === 'male');
  const unknownVoices = tts.voices.filter(v => v.gender === 'unknown');
  const femaleVoice   = femaleVoices[0] ?? unknownVoices[0] ?? null;
  const maleVoice     = maleVoices[0]   ?? unknownVoices[1] ?? null;

  const handleToggle = () => { if (tts.isEnabled) tts.disable(); else tts.enable(); };

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[300]">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-gray-800 text-base">Text to Speech</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {/* Navigation controls */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-center gap-3">
        <button
          onClick={tts.speakPrev}
          disabled={tts.readingIndex <= 0}
          aria-label="Poprzedni akapit"
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <SkipBack size={16} className="text-gray-700" />
        </button>
        <button
          onClick={tts.isPlaying ? tts.disable : tts.speakNext}
          aria-label={tts.isPlaying ? 'Zatrzymaj' : 'Odtwórz / następny'}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm
            ${tts.isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {tts.isPlaying
            ? <span className="w-3 h-3 bg-white rounded-sm" />
            : <svg viewBox="0 0 10 12" width="14" fill="white"><polygon points="0,0 10,6 0,12" /></svg>
          }
        </button>
        <button
          onClick={tts.speakNext}
          disabled={tts.readingTotal > 0 && tts.readingIndex >= tts.readingTotal - 1}
          aria-label="Następny akapit"
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <SkipForward size={16} className="text-gray-700" />
        </button>
        {tts.readingTotal > 0 && (
          <span className="text-[11px] text-gray-400 ml-1">{tts.readingIndex + 1}/{tts.readingTotal}</span>
        )}
      </div>

      <div className="px-4 divide-y divide-gray-100">
        <PanelRow label="Text To Speech (Wł/Wył)">
          <Checkbox checked={tts.isEnabled} onChange={handleToggle} />
        </PanelRow>
        <PanelRow label="Czytaj automatycznie">
          <Checkbox checked={tts.playAutomatically} onChange={tts.setPlayAutomatically} />
        </PanelRow>
        <PanelRow label="Czytaj całą stronę">
          <Checkbox checked={tts.readWholePage} onChange={tts.setReadWholePage} />
        </PanelRow>

        <div className="pt-3 pb-1">
          <span className="text-[15px] font-semibold text-gray-800">Głos</span>
        </div>

        {femaleVoice && (
          <PanelRow label="Kobieta">
            <RadioBtn checked={tts.selectedVoice?.name === femaleVoice.voice.name} onChange={() => tts.setVoice(femaleVoice.voice)} />
          </PanelRow>
        )}
        {maleVoice && maleVoice !== femaleVoice && (
          <PanelRow label="Mężczyzna">
            <RadioBtn checked={tts.selectedVoice?.name === maleVoice.voice.name} onChange={() => tts.setVoice(maleVoice.voice)} />
          </PanelRow>
        )}
        {tts.voices.length > 2 && tts.voices.slice(2).map(v => (
          <PanelRow key={v.voice.name} label={v.voice.name}>
            <RadioBtn checked={tts.selectedVoice?.name === v.voice.name} onChange={() => tts.setVoice(v.voice)} />
          </PanelRow>
        ))}

        <PanelRow label="Prędkość czytania:">
          <div className="flex items-center gap-2">
            <button onClick={() => tts.setSpeedLevel(Math.max(1, tts.speedLevel - 1))} disabled={tts.speedLevel <= 1}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center font-bold text-gray-700 transition-colors">−</button>
            <span className="text-base font-semibold text-gray-800 w-4 text-center">{tts.speedLevel}</span>
            <button onClick={() => tts.setSpeedLevel(Math.min(5, tts.speedLevel + 1))} disabled={tts.speedLevel >= 5}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center font-bold text-gray-700 transition-colors">+</button>
          </div>
        </PanelRow>

        <div className="py-3">
          <button onClick={() => setShortcutsOpen(v => !v)} className="flex items-center justify-between w-full">
            <span className="text-[15px] font-semibold text-gray-800">Skróty klawiszowe</span>
            <span className="flex items-center gap-1 px-3 py-1 border-2 border-[#b8860b] text-[13px] font-semibold text-gray-700 rounded">
              {shortcutsOpen ? 'Zamknij' : 'Pokaż'}
              {shortcutsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </button>
          {shortcutsOpen && (
            <ul className="mt-3 space-y-1.5">
              {KEYBOARD_SHORTCUTS.map(s => (
                <li key={s.action} className="text-sm text-gray-600">
                  {s.action} — <span className="font-semibold text-gray-800">{s.keys}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button onClick={() => tts.reset()}
          className="w-full py-2.5 rounded border border-gray-300 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Resetuj ustawienia
        </button>
      </div>
    </div>
  );
}

/* ── Font Panel ──────────────────────────────────────────────────── */
const FONT_OPTIONS: Array<{ value: FontType; label: string; preview: string }> = [
  { value: 'normal',   label: 'Domyślna',    preview: 'font-sans' },
  { value: 'sans',     label: 'Sans-serif',  preview: 'font-sans' },
  { value: 'serif',    label: 'Szeryfowa',   preview: 'font-serif' },
  { value: 'dyslexia', label: 'Dysleksja',   preview: 'font-mono' },
];

function FontPanel({ fontSizeLevel, setFontSizeLevel, fontType, setFontType, onClose }: {
  fontSizeLevel: number; setFontSizeLevel: (l: number) => void;
  fontType: FontType; setFontType: (t: FontType) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[300]">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-gray-800 text-base">Tekst</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><X size={16} /></button>
      </div>

      {/* Font size */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <span className="text-[13px] font-semibold text-gray-600 block mb-2">Rozmiar tekstu</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setFontSizeLevel(fontSizeLevel - 1)} disabled={fontSizeLevel <= 0}
            className="w-9 h-9 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-700 font-bold text-lg flex items-center justify-center">−</button>
          <span className="text-xl font-bold text-gray-800 flex-1 text-center" style={{ fontSize: `${1 + fontSizeLevel * 0.08}em` }}>Aa</span>
          <button onClick={() => setFontSizeLevel(fontSizeLevel + 1)} disabled={fontSizeLevel >= 4}
            className="w-9 h-9 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-700 font-bold text-lg flex items-center justify-center">+</button>
        </div>
        {fontSizeLevel > 0 && <p className="text-[11px] text-gray-400 text-center mt-1">+{fontSizeLevel * 8}%</p>}
      </div>

      {/* Font type */}
      <div className="px-4 py-3">
        <span className="text-[13px] font-semibold text-gray-600 block mb-2">Czcionka</span>
        <div className="space-y-1">
          {FONT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setFontType(opt.value)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between
                ${fontType === opt.value ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
              <span className={opt.preview}>{opt.label}</span>
              {fontType === opt.value && <span className="text-white text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Toolbar ──────────────────────────────────────────────────── */
export default function AccessibilityToolbar({ settings, toggleSetting, resetSettings, onClose, tts, fontSizeLevel, setFontSizeLevel, fontType, setFontType }: Props) {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const ttsPanelRef  = useRef<HTMLDivElement>(null);
  const fontPanelRef = useRef<HTMLDivElement>(null);
  const [isTTSPanelOpen,  setIsTTSPanelOpen]  = useState(false);
  const [isFontPanelOpen, setIsFontPanelOpen] = useState(false);

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 180 : -180, behavior: 'smooth' });

  useEffect(() => {
    if (!isTTSPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (ttsPanelRef.current && !ttsPanelRef.current.contains(e.target as Node))
        setIsTTSPanelOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isTTSPanelOpen]);

  useEffect(() => {
    if (!isFontPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (fontPanelRef.current && !fontPanelRef.current.contains(e.target as Node))
        setIsFontPanelOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFontPanelOpen]);

  // Keyboard shortcut: Ctrl+Alt+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'z') {
        if (tts.isEnabled) tts.disable(); else tts.enable();
      }
      if (e.ctrlKey && e.altKey && e.key === 's') tts.disable();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [tts]);

  const activeCount = TILES.filter(t => settings[t.key]).length
    + (fontSizeLevel > 0 ? 1 : 0)
    + (fontType !== 'normal' ? 1 : 0);
  const hc = settings.isHighContrast;

  return (
    <div
      data-a11y-toolbar
      className={`hidden md:flex items-center h-12 border-b px-3 gap-1
        ${hc ? 'bg-black border-yellow-400' : 'bg-white border-gray-200'}`}
    >
      {/* Logo */}
      <div className={`flex items-center shrink-0 pr-2 border-r ${hc ? 'border-yellow-400' : 'border-gray-200'}`}>
        <Image src="/images/logo_dostepnosc.webp" alt="Dostępność" width={20} height={20} />
      </div>

      {/* TTS */}
      <div ref={ttsPanelRef} className={`flex items-center gap-1.5 shrink-0 pr-2 border-r relative ${hc ? 'border-yellow-400' : 'border-gray-200'}`}>
        <div className="relative group shrink-0">
          <button
            onClick={() => setIsTTSPanelOpen(v => !v)}
            aria-label="Czytanie na głos"
            className={`w-10 h-10 flex items-center justify-center rounded transition-all duration-150
              ${tts.isEnabled
                ? hc ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
                : hc ? 'text-white hover:bg-gray-800' : 'bg-green-500 text-white opacity-60 hover:opacity-100'
              }`}
          >
            <Volume2 size={21} />
          </button>
          <Tip label="Czytanie na głos" description="Czyta tekst strony na głos po najechaniu kursorem" />
        </div>

        {tts.isEnabled && (
          <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap
            ${tts.isPlaying ? 'bg-green-100 text-green-700' : 'text-gray-400 border border-gray-200'}`}>
            {tts.isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />}
            {tts.isPlaying ? 'Czyta...' : tts.readWholePage ? 'Włączone' : 'Najedź na tekst'}
          </span>
        )}

        {isTTSPanelOpen && <TTSPanel tts={tts} onClose={() => setIsTTSPanelOpen(false)} />}
      </div>

      {/* Font controls */}
      <div ref={fontPanelRef} className={`flex items-center gap-1 shrink-0 pr-2 border-r relative ${hc ? 'border-yellow-400' : 'border-gray-200'}`}>
        <button
          onClick={() => setFontSizeLevel(fontSizeLevel - 1)}
          disabled={fontSizeLevel <= 0}
          aria-label="Zmniejsz tekst"
          className={`w-8 h-8 flex items-center justify-center rounded font-bold text-lg transition-colors disabled:opacity-30
            ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
        >−</button>
        <button
          onClick={() => setIsFontPanelOpen(v => !v)}
          aria-label="Ustawienia tekstu"
          className={`h-8 px-1.5 flex items-center justify-center rounded font-bold text-[13px] transition-colors
            ${isFontPanelOpen || fontType !== 'normal' || fontSizeLevel > 0
              ? hc ? 'bg-yellow-400 text-black' : 'bg-blue-500 text-white'
              : hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <Type size={15} className="mr-0.5" />Aa
        </button>
        <button
          onClick={() => setFontSizeLevel(fontSizeLevel + 1)}
          disabled={fontSizeLevel >= 4}
          aria-label="Powiększ tekst"
          className={`w-8 h-8 flex items-center justify-center rounded font-bold text-lg transition-colors disabled:opacity-30
            ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
        >+</button>

        {isFontPanelOpen && (
          <FontPanel
            fontSizeLevel={fontSizeLevel}
            setFontSizeLevel={setFontSizeLevel}
            fontType={fontType}
            setFontType={setFontType}
            onClose={() => setIsFontPanelOpen(false)}
          />
        )}
      </div>

      {/* Scroll left */}
      <button onClick={() => scroll('left')} aria-label="Przewiń w lewo"
        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors
          ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
        <ChevronLeft size={14} />
      </button>

      {/* Tiles */}
      <div ref={scrollRef} className="flex gap-1 overflow-x-auto flex-1 items-center" style={{ scrollbarWidth: 'none' }}>
        {TILES.map(({ key, label, description, icon, color }) => (
          <Tile key={key} onClick={() => toggleSetting(key)} label={label} description={description} icon={icon}
            color={color} isActive={settings[key]} hc={hc} />
        ))}
      </div>

      {/* Scroll right */}
      <button onClick={() => scroll('right')} aria-label="Przewiń w prawo"
        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors
          ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
        <ChevronRight size={14} />
      </button>

      {/* Right controls */}
      <div className={`flex items-center gap-1.5 shrink-0 pl-2 border-l ${hc ? 'border-yellow-400' : 'border-gray-200'}`}>
        {activeCount > 0 && (
          <button onClick={resetSettings} title="Resetuj ustawienia dostępności"
            className={`flex items-center gap-1 px-2 h-6 rounded text-xs font-medium transition-colors
              ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
            <RotateCcw size={11} />
            <span>Reset ({activeCount})</span>
          </button>
        )}
        <button onClick={onClose} aria-label="Zamknij pasek dostępności"
          className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold transition-colors
            ${hc ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-[#4CAF50] text-white hover:bg-[#43A047]'}`}>
          <span>Dostępność</span>
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
