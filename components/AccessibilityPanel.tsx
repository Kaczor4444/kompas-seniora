'use client';

import React from 'react';
import Image from 'next/image';
import {
  X, Type, Link2, ZapOff, Check, MoveVertical,
  MousePointer2, ImageOff, AlignLeft, MoveHorizontal, Droplet, ArrowUpFromLine,
  MessageSquare, RotateCcw
} from 'lucide-react';

const AccessibilityIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <Image
    src="/images/logo_dostepnosc.webp"
    alt="Dostępność"
    width={size}
    height={size}
    className={className}
  />
);

interface AccessibilitySettings {
  isHighContrast: boolean;
  linksUnderlined: boolean;
  reduceMotion: boolean;
  textSpacing: boolean;
  hideImages: boolean;
  bigCursor: boolean;
  lineHeight: boolean;
  textAlignLeft: boolean;
  saturation: boolean;
  tooltips: boolean;
  darkMode: boolean;
  readingRuler: boolean;
  screenMask: boolean;
}

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
  resetSettings: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  settings,
  toggleSetting,
  resetSettings
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center bg-white z-10">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AccessibilityIcon className="text-primary-600" size={20} />
                Dostępność
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors text-slate-500"
              aria-label="Zamknij panel"
            >
              <X size={20} />
            </button>
        </div>

        {/* Content - Grid Layout */}
        <div className="flex-grow overflow-y-auto p-3 bg-stone-50">
            <div className="grid grid-cols-2 gap-2">

                <GridToggle
                    label="Kontrast +"
                    icon={<AccessibilityIcon size={24} />}
                    isActive={settings.isHighContrast}
                    onClick={() => toggleSetting('isHighContrast')}
                    activeClass="bg-amber-500 border-amber-600"
                />

                <GridToggle
                    label="Podświetl linki"
                    icon={<Link2 size={24} />}
                    isActive={settings.linksUnderlined}
                    onClick={() => toggleSetting('linksUnderlined')}
                    activeClass="bg-emerald-500 border-emerald-600"
                />

                <GridToggle
                    label="Tryb ciemny"
                    icon={<Type size={24} />}
                    isActive={settings.darkMode}
                    onClick={() => toggleSetting('darkMode')}
                    activeClass="bg-slate-700 border-slate-800"
                />

                <GridToggle
                    label="Odstępy"
                    icon={<MoveHorizontal size={24} />}
                    isActive={settings.textSpacing}
                    onClick={() => toggleSetting('textSpacing')}
                    activeClass="bg-violet-500 border-violet-600"
                />

                <GridToggle
                    label="Stop Animacje"
                    icon={<ZapOff size={24} />}
                    isActive={settings.reduceMotion}
                    onClick={() => toggleSetting('reduceMotion')}
                    activeClass="bg-orange-500 border-orange-600"
                />

                <GridToggle
                    label="Ukryj obrazy"
                    icon={<ImageOff size={24} />}
                    isActive={settings.hideImages}
                    onClick={() => toggleSetting('hideImages')}
                    activeClass="bg-red-500 border-red-600"
                />

                <GridToggle
                    label="Linijka"
                    icon={<MoveVertical size={24} />}
                    isActive={settings.readingRuler}
                    onClick={() => toggleSetting('readingRuler')}
                    activeClass="bg-orange-500 border-orange-600"
                />

                <GridToggle
                    label="Duży Kursor"
                    icon={<MousePointer2 size={24} />}
                    isActive={settings.bigCursor}
                    onClick={() => toggleSetting('bigCursor')}
                    activeClass="bg-pink-500 border-pink-600"
                />

                <GridToggle
                    label="Podpowiedzi"
                    icon={<MessageSquare size={24} />}
                    isActive={settings.tooltips}
                    onClick={() => toggleSetting('tooltips')}
                    activeClass="bg-indigo-500 border-indigo-600"
                />

                <GridToggle
                    label="Interlinia"
                    icon={<ArrowUpFromLine size={24} />}
                    isActive={settings.lineHeight}
                    onClick={() => toggleSetting('lineHeight')}
                    activeClass="bg-lime-600 border-lime-700"
                />

                <GridToggle
                    label="Wyrównanie"
                    icon={<AlignLeft size={24} />}
                    isActive={settings.textAlignLeft}
                    onClick={() => toggleSetting('textAlignLeft')}
                    activeClass="bg-cyan-500 border-cyan-600"
                />

                <GridToggle
                    label="Monochrom"
                    icon={<Droplet size={24} />}
                    isActive={settings.saturation}
                    onClick={() => toggleSetting('saturation')}
                    activeClass="bg-slate-500 border-slate-600"
                />
            </div>
        </div>

        {/* Footer Area */}
        <div className="p-3 bg-white border-t border-stone-100">
            <button
              onClick={resetSettings}
              className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw size={15} /> Resetuj ustawienia
            </button>
        </div>
      </div>
    </>
  );
};

const GridToggle = ({
  label,
  icon,
  isActive,
  onClick,
  activeClass = 'bg-primary-600 border-primary-600',
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeClass?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-row items-center gap-3 px-4 rounded-xl transition-all duration-200 border shadow-sm h-20
      ${isActive
        ? `${activeClass} text-white`
        : 'border-transparent bg-white text-slate-600 hover:border-stone-200 hover:bg-stone-50'
      }`}
  >
    <div className={`p-2 rounded-full shrink-0 transition-colors ${isActive ? 'bg-white/20' : 'bg-stone-100'}`}>
      {icon}
    </div>

    <span className="font-bold text-sm text-left leading-tight flex-1">
      {label}
    </span>

    {isActive && <Check size={14} className="shrink-0 opacity-60" />}
  </button>
);
