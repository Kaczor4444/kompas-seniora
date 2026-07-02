'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ChevronLeft, ChevronRight, RotateCcw,
  Type, Link2, ZapOff, MoveVertical, MoveHorizontal,
  MousePointer2, ImageOff, AlignLeft, Droplet,
  ArrowUpFromLine, MessageSquare, X, Volume2, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { TTSState } from '@/src/hooks/useTTS';

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
  tts: TTSState;
}

const TILES: Array<{ key: keyof AccessibilitySettings; label: string; icon: React.ReactNode; color: string }> = [
  { key: 'isHighContrast',  label: 'Wysoki kontrast',   icon: <Image src="/images/logo_dostepnosc.webp" alt="" width={22} height={22} className="invert brightness-200" />, color: 'bg-amber-500' },
  { key: 'isLargeFont',     label: 'Większy tekst',     icon: <Type size={21} />,           color: 'bg-blue-500' },
  { key: 'linksUnderlined', label: 'Podkreśl linki',    icon: <Link2 size={21} />,          color: 'bg-emerald-600' },
  { key: 'textSpacing',     label: 'Odstępy tekstu',    icon: <MoveHorizontal size={21} />, color: 'bg-blue-700' },
  { key: 'reduceMotion',    label: 'Stop animacje',     icon: <ZapOff size={21} />,         color: 'bg-orange-500' },
  { key: 'hideImages',      label: 'Ukryj obrazy',      icon: <ImageOff size={21} />,       color: 'bg-red-500' },
  { key: 'dyslexiaFriendly',label: 'Dysleksja',         icon: <MoveVertical size={21} />,   color: 'bg-teal-600' },
  { key: 'bigCursor',       label: 'Duży kursor',       icon: <MousePointer2 size={21} />,  color: 'bg-slate-700' },
  { key: 'tooltips',        label: 'Podpowiedzi',       icon: <MessageSquare size={21} />,  color: 'bg-indigo-600' },
  { key: 'lineHeight',      label: 'Interlinia',        icon: <ArrowUpFromLine size={21} />,color: 'bg-lime-600' },
  { key: 'textAlignLeft',   label: 'Wyrównaj do lewej', icon: <AlignLeft size={21} />,      color: 'bg-cyan-600' },
  { key: 'saturation',      label: 'Monochromatyczny',  icon: <Droplet size={21} />,        color: 'bg-gray-500' },
];

const KEYBOARD_SHORTCUTS = [
  { action: 'Włącz/Wyłącz czytanie', keys: 'Ctrl + Alt + Z' },
  { action: 'Zatrzymaj czytanie',     keys: 'Ctrl + Alt + S' },
  { action: 'Odtwórz',               keys: 'Ctrl + Alt + P' },
];

function Tip({ label }: { label: string }) {
  return (
    <span className="
      pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2
      px-2 py-1 rounded bg-gray-900 text-white text-[11px] font-medium whitespace-nowrap
      opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[200]
      before:content-[''] before:absolute before:bottom-full before:left-1/2
      before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-gray-900
    ">
      {label}
    </span>
  );
}

function Tile({ onClick, label, icon, color, isActive, hc }: {
  onClick: () => void; label: string; icon: React.ReactNode;
  color: string; isActive: boolean; hc: boolean;
}) {
  return (
    <div className="relative group shrink-0">
      <button
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
      {!hc && <Tip label={label} />}
    </div>
  );
}

/* ── Row helpers for the TTS panel ──────────────────────────────── */
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

function TTSPanel({ tts, onClose }: { tts: TTSState; onClose: () => void }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Separate female and male voices; fall back to showing by index
  const femaleVoices = tts.voices.filter(v => v.gender === 'female');
  const maleVoices   = tts.voices.filter(v => v.gender === 'male');
  const unknownVoices= tts.voices.filter(v => v.gender === 'unknown');

  // Build a simplified Male/Female list for the UI
  const femaleVoice = femaleVoices[0] ?? unknownVoices[0] ?? null;
  const maleVoice   = maleVoices[0]   ?? unknownVoices[1] ?? null;

  const handleToggle = () => {
    if (tts.isEnabled) tts.disable();
    else tts.enable();
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[300]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-gray-800 text-base">Text to Speech</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      <div className="px-4 divide-y divide-gray-100">
        {/* On/Off */}
        <PanelRow label="Text To Speech (Wł/Wył)">
          <Checkbox checked={tts.isEnabled} onChange={handleToggle} />
        </PanelRow>

        {/* Play automatically */}
        <PanelRow label="Czytaj automatycznie">
          <Checkbox checked={tts.playAutomatically} onChange={tts.setPlayAutomatically} />
        </PanelRow>

        {/* Read whole page */}
        <PanelRow label="Czytaj całą stronę">
          <Checkbox checked={tts.readWholePage} onChange={tts.setReadWholePage} />
        </PanelRow>

        {/* Voice section header */}
        <div className="pt-3 pb-1">
          <span className="text-[15px] font-semibold text-gray-800">Głos</span>
        </div>

        {/* Female */}
        {femaleVoice && (
          <PanelRow label="Kobieta">
            <RadioBtn
              checked={tts.selectedVoice?.name === femaleVoice.voice.name}
              onChange={() => tts.setVoice(femaleVoice.voice)}
            />
          </PanelRow>
        )}

        {/* Male */}
        {maleVoice && maleVoice !== femaleVoice && (
          <PanelRow label="Mężczyzna">
            <RadioBtn
              checked={tts.selectedVoice?.name === maleVoice.voice.name}
              onChange={() => tts.setVoice(maleVoice.voice)}
            />
          </PanelRow>
        )}

        {/* Extra voices (if many) */}
        {tts.voices.length > 2 && tts.voices.slice(2).map(v => (
          <PanelRow key={v.voice.name} label={v.voice.name}>
            <RadioBtn
              checked={tts.selectedVoice?.name === v.voice.name}
              onChange={() => tts.setVoice(v.voice)}
            />
          </PanelRow>
        ))}

        {/* Reading speed */}
        <PanelRow label="Prędkość czytania:">
          <div className="flex items-center gap-2">
            <button
              onClick={() => tts.setSpeedLevel(Math.max(1, tts.speedLevel - 1))}
              disabled={tts.speedLevel <= 1}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center font-bold text-gray-700 transition-colors"
            >
              −
            </button>
            <span className="text-base font-semibold text-gray-800 w-4 text-center">{tts.speedLevel}</span>
            <button
              onClick={() => tts.setSpeedLevel(Math.min(5, tts.speedLevel + 1))}
              disabled={tts.speedLevel >= 5}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center font-bold text-gray-700 transition-colors"
            >
              +
            </button>
          </div>
        </PanelRow>

        {/* Keyboard shortcuts */}
        <div className="py-3">
          <button
            onClick={() => setShortcutsOpen(v => !v)}
            className="flex items-center justify-between w-full"
          >
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

      {/* Reset */}
      <div className="px-4 pb-4">
        <button
          onClick={() => { tts.reset(); }}
          className="w-full py-2.5 rounded border border-gray-300 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Resetuj ustawienia
        </button>
      </div>
    </div>
  );
}

/* ── Main Toolbar ──────────────────────────────────────────────────── */
export default function AccessibilityToolbar({ settings, toggleSetting, resetSettings, onClose, tts }: Props) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const [isTTSPanelOpen, setIsTTSPanelOpen] = useState(false);
  const ttsPanelRef = useRef<HTMLDivElement>(null);

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

  const activeCount = TILES.filter(t => settings[t.key]).length;
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
      <div
        ref={ttsPanelRef}
        className={`flex items-center gap-1.5 shrink-0 pr-2 border-r relative ${hc ? 'border-yellow-400' : 'border-gray-200'}`}
      >
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
          <Tip label="Czytanie na głos" />
        </div>

        {tts.isEnabled && (
          <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap
            ${tts.isPlaying
              ? 'bg-green-100 text-green-700'
              : 'text-gray-400 border border-gray-200'
            }`}
          >
            {tts.isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />}
            {tts.isPlaying ? 'Czyta...' : tts.readWholePage ? 'Włączone' : 'Najedź na tekst'}
          </span>
        )}

        {isTTSPanelOpen && <TTSPanel tts={tts} onClose={() => setIsTTSPanelOpen(false)} />}
      </div>

      {/* Scroll left */}
      <button onClick={() => scroll('left')} aria-label="Przewiń w lewo"
        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors
          ${hc ? 'text-yellow-400 hover:bg-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
        <ChevronLeft size={14} />
      </button>

      {/* Tiles */}
      <div ref={scrollRef} className="flex gap-1 overflow-x-auto flex-1 items-center" style={{ scrollbarWidth: 'none' }}>
        {TILES.map(({ key, label, icon, color }) => (
          <Tile key={key} onClick={() => toggleSetting(key)} label={label} icon={icon}
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
