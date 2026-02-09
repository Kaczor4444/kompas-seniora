'use client';

import React from 'react';
import {
  X, Type, Eye, Link2, ZapOff, Check, MoveVertical,
  MousePointer2, ImageOff, AlignLeft, MoveHorizontal, Droplet, ArrowUpFromLine,
  MessageSquare, RotateCcw
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

        {/* Header - Clean Style */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white z-10">
            <div>
                <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                <Eye className="text-primary-600" size={24} />
                Dostępność
                </h2>
                <p className="text-xs text-slate-500 mt-1">Dostosuj widok strony</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors text-slate-500"
              aria-label="Zamknij panel"
            >
              <X size={24} />
            </button>
        </div>

        {/* Content - Grid Layout */}
        <div className="flex-grow overflow-y-auto p-4 bg-stone-50">
            <div className="grid grid-cols-2 gap-3">

                {/* Contrast */}
                <GridToggle
                    label="Kontrast +"
                    icon={<Eye size={24} />}
                    isActive={settings.isHighContrast}
                    onClick={() => toggleSetting('isHighContrast')}
                />

                {/* Highlight Links */}
                <GridToggle
                    label="Podświetl linki"
                    icon={<Link2 size={24} />}
                    isActive={settings.linksUnderlined}
                    onClick={() => toggleSetting('linksUnderlined')}
                />

                {/* Bigger Text */}
                <GridToggle
                    label="Większy tekst"
                    icon={<Type size={24} />}
                    isActive={settings.isLargeFont}
                    onClick={() => toggleSetting('isLargeFont')}
                />

                {/* Text Spacing */}
                <GridToggle
                    label="Odstępy"
                    icon={<MoveHorizontal size={24} />}
                    isActive={settings.textSpacing}
                    onClick={() => toggleSetting('textSpacing')}
                />

                {/* Pause Animations */}
                <GridToggle
                    label="Stop Animacje"
                    icon={<ZapOff size={24} />}
                    isActive={settings.reduceMotion}
                    onClick={() => toggleSetting('reduceMotion')}
                />

                {/* Hide Images */}
                <GridToggle
                    label="Ukryj obrazy"
                    icon={<ImageOff size={24} />}
                    isActive={settings.hideImages}
                    onClick={() => toggleSetting('hideImages')}
                />

                {/* Dyslexia Friendly */}
                <GridToggle
                    label="Dla dyslektyków"
                    icon={<MoveVertical size={24} />}
                    isActive={settings.dyslexiaFriendly}
                    onClick={() => toggleSetting('dyslexiaFriendly')}
                />

                {/* Cursor */}
                <GridToggle
                    label="Duży Kursor"
                    icon={<MousePointer2 size={24} />}
                    isActive={settings.bigCursor}
                    onClick={() => toggleSetting('bigCursor')}
                />

                {/* Tooltips */}
                <GridToggle
                    label="Podpowiedzi"
                    icon={<MessageSquare size={24} />}
                    isActive={settings.tooltips}
                    onClick={() => toggleSetting('tooltips')}
                />

                {/* Line Height */}
                <GridToggle
                    label="Interlinia"
                    icon={<ArrowUpFromLine size={24} />}
                    isActive={settings.lineHeight}
                    onClick={() => toggleSetting('lineHeight')}
                />

                {/* Text Align */}
                <GridToggle
                    label="Wyrównanie"
                    icon={<AlignLeft size={24} />}
                    isActive={settings.textAlignLeft}
                    onClick={() => toggleSetting('textAlignLeft')}
                />

                {/* Saturation */}
                <GridToggle
                    label="Monochrom"
                    icon={<Droplet size={24} />}
                    isActive={settings.saturation}
                    onClick={() => toggleSetting('saturation')}
                />
            </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 bg-white border-t border-stone-100">
            <button
              onClick={resetSettings}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Resetuj ustawienia
            </button>
        </div>
      </div>
    </>
  );
};

const GridToggle = ({ label, icon, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 border shadow-sm relative h-32
      ${isActive
        ? 'border-primary-600 bg-primary-600 text-white shadow-primary-600/20'
        : 'border-transparent bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600'
      }`}
  >
    <div className={`p-2 rounded-full mb-1 transition-colors ${isActive ? 'bg-white/20' : 'bg-stone-100'}`}>
      {icon}
    </div>

    <span className="font-bold text-center leading-tight text-sm">
        {label}
    </span>

    {isActive && (
        <div className="absolute top-2 right-2 opacity-50">
            <Check size={16} />
        </div>
    )}
  </button>
);
