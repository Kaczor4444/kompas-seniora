// src/components/search/FilterPanel.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterPanelProps {
  show: boolean;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedVoivodeship: string;
  onVoivodeshipChange: (value: string) => void;
  selectedPowiat: string;
  onPowiatChange: (value: string) => void;
  selectedProfile: string;
  onProfileChange: (value: string) => void;
  priceLimit: number;
  onPriceLimitChange: (value: number) => void;
  availablePowiats: string[];
  onReset: () => void;
  onClose: () => void;
}

const VOIVODESHIPS = [
  "Wszystkie", "Dolnośląskie", "Kujawsko-pomorskie", "Lubelskie", "Lubuskie",
  "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie",
  "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie",
  "Świętokrzyskie", "Warmińsko-mazurskie", "Wielkopolskie", "Zachodniopomorskie"
];

const CARE_PROFILES = [
  "Wszystkie", "Osoby starsze", "Somatycznie chorzy", "Psychicznie chorzy",
  "Niepełnosprawni intelektualnie", "Niepełnosprawni fizycznie", "Dzieci i młodzież", "Uzależnieni"
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  show,
  selectedType,
  onTypeChange,
  selectedVoivodeship,
  onVoivodeshipChange,
  selectedPowiat,
  onPowiatChange,
  selectedProfile,
  onProfileChange,
  priceLimit,
  onPriceLimitChange,
  availablePowiats,
  onReset,
  onClose
}) => {
  if (!show) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        
        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          
          <FilterSelect
            label="Typ placówki"
            value={selectedType}
            onChange={onTypeChange}
            options={[
              { value: "all", label: "Wszystkie" },
              { value: "DPS", label: "DPS (Całodobowe)" },
              { value: "ŚDS", label: "ŚDS (Dzienne)" }
            ]}
          />

          <FilterSelect
            label="Województwo"
            value={selectedVoivodeship}
            onChange={onVoivodeshipChange}
            options={VOIVODESHIPS.map(v => ({ value: v, label: v }))}
          />

          <FilterSelect
            label="Powiat"
            value={selectedPowiat}
            onChange={onPowiatChange}
            options={availablePowiats.map(p => ({ value: p, label: p }))}
          />

          <FilterSelect
            label="Profil podopiecznego"
            value={selectedProfile}
            onChange={onProfileChange}
            options={CARE_PROFILES.map(p => ({ value: p, label: p }))}
          />
        </div>

        {/* Price Range */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-3">
            Cena miesięczna: <span className="text-gray-900 font-semibold">{priceLimit} zł</span>
          </label>
          <input
            type="range"
            min="0"
            max="10000"
            step="500"
            value={priceLimit}
            onChange={(e) => onPriceLimitChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onReset}
            className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            Wyczyść filtry
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const FilterSelect = ({ label, value, onChange, options }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          px-4 py-3 pr-10
          bg-white border border-gray-200 rounded-xl
          text-sm font-medium
          appearance-none
          hover:border-gray-300
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          outline-none
          cursor-pointer
          transition-all
        "
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  </div>
);
