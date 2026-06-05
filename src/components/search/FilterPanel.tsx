// src/components/search/FilterPanel.tsx
import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

// Helper function for profile names
const getProfileName = (code: string): string => {
  const mapping: Record<string, string> = {
    'A': 'Niepełnosprawnić intelektualna',
    'B': 'Zaburzenia psychiczne',
    'C': 'Choroby przewlekłe',
    'D': 'Podeszły wiek',
    'E': 'Osoby starsze',
    'F': 'Choroby somatyczne',
    'G': 'Dzieci niepełnosprawne',
    'H': 'Młodzież niepełnosprawna',
    'I': 'Niepełnosprawnić fizyczna',
  };
  return mapping[code] || code;
};

interface FilterPanelProps {
  show: boolean;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedPowiat: string;
  onPowiatChange: (value: string) => void;
  selectedProfiles: string[];
  onProfilesChange: (value: string[]) => void;
  priceLimit: number;
  onPriceLimitChange: (value: number) => void;
  maxDistance?: number;
  onMaxDistanceChange?: (value: number) => void;
  maxDistanceFromCity?: number;
  onMaxDistanceFromCityChange?: (value: number) => void;
  availablePowiats: string[];
  availableProfiles?: string[];
  userLocation?: { lat: number; lng: number };
  searchCenter?: { lat: number; lng: number; name: string };
  onReset: () => void;
  onClose: () => void;
  onApply?: () => void;
  onlyWithFreeSpaces?: boolean;
  onOnlyWithFreeSpacesChange?: (value: boolean) => void;
  wolneMiejscaDate?: Date | null;
}

const ALL_CARE_PROFILES = [
  { value: "E", label: "Osoby starsze" },
  { value: "C", label: "Psychicznie chorzy" },
  { value: "F", label: "Somatycznie chorzy" },
  { value: "A", label: "Niepełnosprawni intelektualnie" },
  { value: "I", label: "Niepełnosprawni fizycznie" },
  { value: "G", label: "Dzieci niepełnosprawne" },
  { value: "H", label: "Młodzież niepełnosprawna" },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  show,
  selectedType,
  onTypeChange,
  selectedPowiat,
  onPowiatChange,
  selectedProfiles,
  onProfilesChange,
  priceLimit,
  onPriceLimitChange,
  maxDistance,
  onMaxDistanceChange,
  maxDistanceFromCity,
  onMaxDistanceFromCityChange,
  availablePowiats,
  availableProfiles,
  userLocation,
  searchCenter,
  onReset,
  onClose,
  onApply,
  onlyWithFreeSpaces = false,
  onOnlyWithFreeSpacesChange,
  wolneMiejscaDate,
}) => {
  const careProfiles = availableProfiles && availableProfiles.length > 0
    ? ALL_CARE_PROFILES.filter(p => availableProfiles.includes(p.value))
    : ALL_CARE_PROFILES;

  const [showProfilesMenu, setShowProfilesMenu] = useState(false);

  const handleApply = () => {
    onApply?.();
    onClose();
  };
  if (!show) return null;

  const filterContent = (
    <>
      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <FilterSelect
          label="Typ placówki"
          value={selectedType}
          onChange={onTypeChange}
          options={[
            { value: "all", label: "Wszystkie" },
            { value: "DPS", label: "DPS (Całodobowe)" },
            { value: "Klub Senior+", label: "Klub Senior+" },
            { value: "Dzienny Dom Senior+", label: "Dzienny Dom Senior+" },
          ]}
        />
        <FilterSelect
          label="Powiat (Małopolska)"
          value={selectedPowiat}
          onChange={onPowiatChange}
          options={availablePowiats.map(p => ({ value: p, label: p }))}
        />
      </div>

      {/* Profile Checkboxes */}
      {careProfiles.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={() => setShowProfilesMenu(!showProfilesMenu)}
            className="w-full flex items-center justify-between text-xs font-medium text-gray-500 uppercase mb-3 hover:text-gray-700 transition-colors"
          >
            <span>Profile opieki {selectedProfiles.length > 0 && `(${selectedProfiles.length})`}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showProfilesMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showProfilesMenu && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {careProfiles.map((profile) => {
                const isSelected = selectedProfiles.includes(profile.value);
                return (
                  <label
                    key={profile.value}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onProfilesChange([...selectedProfiles, profile.value]);
                        } else {
                          onProfilesChange(selectedProfiles.filter(c => c !== profile.value));
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{getProfileName(profile.value)}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <label className="block text-xs font-medium text-gray-500 uppercase mb-3">
          Cena miesięczna: <span className="text-gray-900 font-semibold">{priceLimit} zł</span>
        </label>
        <input
          type="range"
          min="0"
          max="13000"
          step="500"
          value={priceLimit}
          onChange={(e) => onPriceLimitChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
      </div>

      {/* Distance from Geolocation Filter */}
      {userLocation && maxDistance !== undefined && onMaxDistanceChange && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-3">
            Odległość: <span className="text-gray-900 font-semibold">{maxDistance === 100 ? 'Wszystkie' : `do ${maxDistance} km`}</span>
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={maxDistance}
            onChange={(e) => onMaxDistanceChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 km</span>
            <span>100 km</span>
          </div>
        </div>
      )}

      {/* Distance from City Filter */}
      {/* ✅ Ukryj dla miast na prawach powiatu (pokazujemy cały powiat) */}
      {(() => {
        if (!searchCenter || userLocation || maxDistanceFromCity === undefined || !onMaxDistanceFromCityChange) {
          return null;
        }

        const isCityCounty = ['kraków', 'krakow', 'nowy sącz', 'nowy sacz', 'tarnów', 'tarnow'].some(city =>
          searchCenter.name.toLowerCase().includes(city)
        );

        if (isCityCounty) {
          return null; // Ukryj slider dla miast na prawach powiatu
        }

        return (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-3">
              Odległość od {searchCenter.name}: <span className="text-gray-900 font-semibold">{maxDistanceFromCity === 100 ? 'Wszystkie' : `do ${maxDistanceFromCity} km`}</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxDistanceFromCity}
              onChange={(e) => onMaxDistanceFromCityChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
        );
      })()}

      {/* Wolne miejsca toggle */}
      {onOnlyWithFreeSpacesChange && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={() => onOnlyWithFreeSpacesChange(!onlyWithFreeSpaces)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 flex items-center mt-0.5 ${onlyWithFreeSpaces ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${onlyWithFreeSpaces ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Tylko wolne miejsca</div>
                {onlyWithFreeSpaces && wolneMiejscaDate && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    stan na {wolneMiejscaDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
        >
          Wyczyść filtry
        </button>
        <button
          onClick={handleApply}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          Zastosuj
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: backdrop + floating card */}
      <div
        className="md:hidden fixed inset-0 z-[9999] bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="mx-3 my-3 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 1.5rem)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 flex-shrink-0">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Filtry</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400 hover:text-slate-900" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {filterContent}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100">
            <button
              onClick={handleApply}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              Zastosuj filtry
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: inline dropdown */}
      <div className="hidden md:block bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {filterContent}
        </div>
      </div>
    </>
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
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
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
