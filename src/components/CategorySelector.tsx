'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, Users, Heart, Sun, Accessibility, Shield, Activity, School, Puzzle, Sparkles, Check, Info, ArrowRight, X } from 'lucide-react';

// Mapowanie tytułów kafelków na kody profili opieki w bazie
const categoryToProfileMap: Record<string, string[]> = {
  // DPS Categories
  "Osoby starsze": ["A"],
  "Somatycznie chorzy": ["B"],
  "Psychicznie chorzy": ["C"],
  "Niepełnosprawni intelektualnie": ["D"],
  "Dzieci i młodzież": ["E"],
  "Niepełnosprawni fizycznie": ["F"],
  "Osoby uzależnione": ["G"],
  
  // ŚDS Categories  
  "Typ A - Psychiczny": ["C"],  // Choroba psychiczna
  "Typ B - Intelektualny": ["D"], // Niepełnosprawność intelektualna
  "Typ C - Inne zaburzenia": ["H"], // Demencja/Alzheimer
  "Typ D - Sprzężone": ["I"],  // Autyzm/sprzężone
};

const dpsCategories = [
  { icon: <Users size={32} />, title: "Osoby starsze", target: "Seniorzy" },
  { icon: <Activity size={32} />, title: "Somatycznie chorzy", target: "Opieka medyczna" },
  { icon: <Heart size={32} />, title: "Psychicznie chorzy", target: "Psychiatria" },
  { icon: <Sun size={32} />, title: "Niepełnosprawni intelektualnie", target: "Dorośli" },
  { icon: <School size={32} />, title: "Dzieci i młodzież", target: "Edukacja i opieka" },
  { icon: <Accessibility size={32} />, title: "Niepełnosprawni fizycznie", target: "Rehabilitacja" },
  { icon: <Shield size={32} />, title: "Osoby uzależnione", target: "Terapia" },
];

const sdsCategories = [
  { icon: <Heart size={32} />, title: "Typ A - Psychiczny", target: "Terapia" },
  { icon: <Puzzle size={32} />, title: "Typ B - Intelektualny", target: "Rozwój" },
  { icon: <Users size={32} />, title: "Typ C - Inne zaburzenia", target: "Demencja/Alzheimer" },
  { icon: <Sparkles size={32} />, title: "Typ D - Sprzężone", target: "Autyzm" },
];

interface CategorySelectorProps {
  activeTab: 'DPS' | 'SDS' | 'Wszystkie';
  onSearch: (query: { location: string; categories: string[]; type: 'DPS' | 'SDS' | 'Wszystkie' }) => void;
  onProfilesChange?: (profiles: string[]) => void;
  location: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ activeTab, onSearch, onProfilesChange, location }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  console.log('🔵 CategorySelector RENDER - activeTab:', activeTab, 'selectedCategories:', selectedCategories);

  // ✅ NEW: Reset selections when activeTab changes
  useEffect(() => {
    console.log('🔄 Tab changed to:', activeTab);
    setSelectedCategories([]);
  }, [activeTab]);

  // ✅ Notify parent via useEffect
  useEffect(() => {
    if (onProfilesChange) {
      const profileCodes = selectedCategories.flatMap(category => 
        categoryToProfileMap[category] || []
      );
      const uniqueProfileCodes = [...new Set(profileCodes)];
      onProfilesChange(uniqueProfileCodes);
      
      console.log('📊 Profile selection changed:', {
        activeTab,
        selectedCategories,
        profileCodes: uniqueProfileCodes
      });
    }
  }, [selectedCategories, onProfilesChange, activeTab]);

  const handleCategorySelect = (title: string) => {
    console.log('👆 Category clicked:', title, 'Current activeTab:', activeTab);
    setSelectedCategories(prev => {
      const newSelection = prev.includes(title)
        ? prev.filter(c => c !== title)
        : [...prev, title];
      console.log('  → New selection:', newSelection);
      return newSelection;
    });
  };

  const currentCategories = useMemo(() => {
    console.log('🎨 Computing currentCategories for activeTab:', activeTab);

    if (activeTab === 'DPS') {
      console.log('  ✓ Returning DPS categories:', dpsCategories.length);
      return dpsCategories;
    }
    if (activeTab === 'SDS') {
      console.log('  ✓ Returning SDS categories:', sdsCategories.length);
      return sdsCategories;
    }

    const allCategories = [...dpsCategories.slice(0, 4), ...sdsCategories.slice(0, 3), ...dpsCategories.slice(4)];
    console.log('  ✓ Returning ALL categories:', allCategories.length);
    return allCategories;
  }, [activeTab]);

  const handleSearchClick = () => {
    setIsSearching(true);
    
    // Mapuj wybrane kategorie na kody profili opieki
    const profileCodes = selectedCategories.flatMap(category => 
      categoryToProfileMap[category] || []
    );
    
    // Usuń duplikaty
    const uniqueProfileCodes = [...new Set(profileCodes)];
    
    console.log('🔍 CategorySelector Search:', {
      selectedCategories,
      profileCodes: uniqueProfileCodes,
      activeTab,
      location
    });
    
    // Przekaż do search page przez URL
    const params = new URLSearchParams();
    
    // ✅ CRITICAL FIX: ZAWSZE dodaj type parameter
    if (activeTab === 'DPS') {
      params.append('type', 'dps');
    } else if (activeTab === 'SDS') {
      params.append('type', 'sds');
    }
    
    if (location) {
      params.append('q', location);
    }
    
    // ✅ CRITICAL: Przekaż profile opieki jako parametr 'care'
    if (uniqueProfileCodes.length > 0) {
      params.append('care', uniqueProfileCodes.join(','));
    }
    
    const url = `/search?${params.toString()}`;
    console.log('🔗 Navigating to:', url);
    
    setTimeout(() => {
      setIsSearching(false);
      window.location.href = url;
    }, 600);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-6 md:mt-10 mb-12">
          <div className="text-left relative group">
            <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 opacity-80">
                   <Info size={18} />
                   <span>Dla kogo szukasz?</span>
                </h3>
                <div className="hidden md:flex text-xs font-bold text-slate-400 gap-2 items-center">
                    Przewiń <ArrowRight size={12} />
                </div>
            </div>

            <div className="flex overflow-x-auto p-6 -mx-6 gap-2 md:gap-3 snap-x snap-mandatory scrollbar-hide md:mx-0 md:py-4 md:px-0">
              {currentCategories.map((cat, idx) => {
                const isSelected = selectedCategories.includes(cat.title);

                let activeBorder = 'border-slate-500 ring-2 ring-slate-200';
                let activeBg = 'bg-slate-50';
                let activeIconColor = 'text-slate-600';

                if (activeTab === 'DPS' || (activeTab === 'Wszystkie' && dpsCategories.some(c => c.title === cat.title))) {
                    activeBorder = 'border-primary-500 ring-2 ring-primary-200';
                    activeBg = 'bg-primary-50';
                    activeIconColor = 'text-primary-600';
                } else if (activeTab === 'SDS' || (activeTab === 'Wszystkie' && sdsCategories.some(c => c.title === cat.title))) {
                    activeBorder = 'border-secondary-500 ring-2 ring-secondary-200';
                    activeBg = 'bg-secondary-50';
                    activeIconColor = 'text-secondary-600';
                }

                return (
                  <div key={`${activeTab}-${idx}`} className="snap-center shrink-0">
                    <button
                      onClick={() => handleCategorySelect(cat.title)}
                      className={`group w-28 sm:w-32 md:w-36 h-full flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                        isSelected
                          ? `${activeBorder} ${activeBg} shadow-md scale-[1.01]`
                          : 'bg-white border-stone-200 shadow-sm hover:border-stone-300 hover:bg-stone-50'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                         <div className="absolute top-1.5 right-1.5">
                           <div className={`rounded-full p-0.5 ${activeTab === 'DPS' ? 'bg-primary-600 text-white' : activeTab === 'SDS' ? 'bg-secondary-600 text-white' : 'bg-slate-800 text-white'}`}>
                              <Check size={12} strokeWidth={3} />
                           </div>
                         </div>
                      )}

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors duration-200 ${
                        isSelected
                          ? `bg-white ${activeIconColor}`
                          : 'bg-stone-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700'
                      }`} aria-hidden="true">
                        {React.cloneElement(cat.icon as React.ReactElement, { size: 20 })}
                      </div>

                      <h4 className={`font-bold text-xs leading-tight mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {cat.title}
                      </h4>

                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                        {cat.target}
                      </span>
                    </button>
                  </div>
                );
              })}

              <div className="w-1 shrink-0"></div>
            </div>

            <div className="absolute top-10 right-0 bottom-6 w-24 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none hidden md:block"></div>
          </div>
      </div>

      {/* ✅ MODIFIED: Hidden on desktop (md:hidden), visible on mobile */}
      <div
        className={`md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 transform ${
          selectedCategories.length > 0
            ? 'translate-y-0 opacity-100'
            : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-lg text-white rounded-2xl p-3 pl-5 shadow-2xl flex items-center justify-between border border-white/10 ring-1 ring-black/5">
           <div className="flex flex-col mr-4 overflow-hidden">
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
               Wybrano ({selectedCategories.length}):
             </span>
             <span className="font-bold text-white text-sm sm:text-base truncate">
                {selectedCategories.join(', ')}
             </span>
           </div>

           <div className="flex items-center gap-2 flex-shrink-0">
             <button
                onClick={handleSearchClick}
                className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2
                  ${activeTab === 'DPS' ? 'bg-primary-600 hover:bg-primary-500'
                  : activeTab === 'SDS' ? 'bg-secondary-600 hover:bg-secondary-500'
                  : 'bg-slate-700 hover:bg-slate-600'}`}
             >
               {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
               <span>Szukaj</span>
             </button>

             <button
               onClick={() => setSelectedCategories([])}
               className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
               aria-label="Wyczyść wybór"
             >
               <X size={20} />
             </button>
           </div>
        </div>
      </div>
    </>
  );
};