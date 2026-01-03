// src/components/search/ComparisonBar.tsx
import React from 'react';
import { X } from 'lucide-react';

interface ComparisonBarProps {
  selectedIds: number[];
  facilities: any[];
  onCompare: () => void;
  onClear: () => void;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  selectedIds,
  facilities,
  onCompare,
  onClear
}) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 max-w-2xl w-full">
      <div className="
        bg-gray-900 text-white
        rounded-2xl
        p-4
        shadow-2xl
        border border-gray-700
        flex items-center gap-4
      ">
        {/* Thumbnails */}
        <div className="flex gap-2">
          {selectedIds.map(id => {
            const facility = facilities.find(f => f.id === id);
            return (
              <div
                key={id}
                className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700"
              >
                {facility?.image && (
                  <img
                    src={facility.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {selectedIds.length} {selectedIds.length === 1 ? 'placówka' : selectedIds.length < 5 ? 'placówki' : 'placówek'} wybrane
          </div>
          <div className="text-xs text-gray-400">
            {selectedIds.length < 3 && 'Wybierz jeszcze, aby porównać'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCompare}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
          >
            Porównaj
          </button>
          <button
            onClick={onClear}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
