// src/components/search/ComparisonBar.tsx
'use client';

import React from 'react';
import { X, Scale, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ComparisonBarProps {
  selectedIds: number[];
  facilities: any[];
  onRemove: (id: number) => void;
  onClear: () => void;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  selectedIds,
  facilities,
  onRemove,
  onClear
}) => {
  const router = useRouter();
  const MAX_COMPARE = 3;

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      alert('Wybierz przynajmniej 2 placówki aby porównać');
      return;
    }
    
    // Navigate to compare page with selected IDs
    router.push(`/ulubione/porownaj?ids=${selectedIds.join(',')}`);
  };

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-6 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="
            bg-gradient-to-r from-slate-900 to-slate-800 
            text-white
            rounded-2xl sm:rounded-3xl
            p-4 sm:p-6
            shadow-2xl
            border border-white/10
            backdrop-blur-xl
            flex flex-col sm:flex-row items-center gap-4
          ">
            {/* Left: Thumbnails */}
            <div className="flex gap-2 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {selectedIds.map((id, index) => {
                  const facility = facilities.find(f => f.id === id);
                  return (
                    <motion.div
                      key={id}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative group"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-700 ring-2 ring-white/20">
                        {facility?.image ? (
                          <img
                            src={facility.image}
                            alt={facility.name || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Scale size={24} />
                          </div>
                        )}
                      </div>
                      
                      {/* Remove button on hover */}
                      <button
                        onClick={() => onRemove(id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>

                      {/* Index badge */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Empty slots */}
                {[...Array(MAX_COMPARE - selectedIds.length)].map((_, i) => (
                  <motion.div
                    key={`empty-${i}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center"
                  >
                    <span className="text-white/30 text-2xl">+</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Center: Text & Progress */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <Scale size={18} className="text-primary-400" />
                <span className="text-base sm:text-lg font-bold">
                  {selectedIds.length}/{MAX_COMPARE} placówek
                </span>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-300">
                {selectedIds.length < 2 ? (
                  'Dodaj jeszcze przynajmniej 1 placówkę'
                ) : selectedIds.length < MAX_COMPARE ? (
                  `Możesz dodać jeszcze ${MAX_COMPARE - selectedIds.length}`
                ) : (
                  'Maksymalna liczba placówek!'
                )}
              </p>

              {/* Progress bar */}
              <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(selectedIds.length / MAX_COMPARE) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={`h-full rounded-full ${
                    selectedIds.length >= 2 ? 'bg-primary-500' : 'bg-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleCompare}
                disabled={selectedIds.length < 2}
                className={`
                  flex-1 sm:flex-none
                  px-6 sm:px-8 py-3 sm:py-3.5
                  rounded-xl sm:rounded-2xl
                  font-bold text-sm sm:text-base
                  transition-all
                  flex items-center justify-center gap-2
                  shadow-lg
                  ${selectedIds.length >= 2
                    ? 'bg-primary-600 hover:bg-primary-500 text-white hover:scale-105 active:scale-95'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                  }
                `}
              >
                Porównaj teraz
                <ChevronRight size={18} className={selectedIds.length >= 2 ? 'animate-pulse' : ''} />
              </button>

              <button
                onClick={onClear}
                className="p-3 hover:bg-white/10 rounded-xl transition-colors shrink-0"
                title="Wyczyść wszystkie"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};