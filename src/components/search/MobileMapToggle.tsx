// src/components/search/MobileMapToggle.tsx
import React from 'react';
import { List, Map } from 'lucide-react';

interface MobileMapToggleProps {
  showMap: boolean;
  onToggle: (show: boolean) => void;
}

export const MobileMapToggle: React.FC<MobileMapToggleProps> = ({
  showMap,
  onToggle
}) => {
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="
        bg-gray-900/95 backdrop-blur-lg
        rounded-full
        p-1
        shadow-2xl
        border border-gray-700
        flex items-center
      ">
        <button
          onClick={() => onToggle(false)}
          className={`
            flex items-center gap-2
            px-6 py-3
            rounded-full
            text-sm font-semibold
            transition-all
            ${!showMap
              ? 'bg-white text-gray-900'
              : 'text-white'
            }
          `}
        >
          <List size={18} />
          <span>Lista</span>
        </button>
        
        <button
          onClick={() => onToggle(true)}
          className={`
            flex items-center gap-2
            px-6 py-3
            rounded-full
            text-sm font-semibold
            transition-all
            ${showMap
              ? 'bg-white text-gray-900'
              : 'text-white'
            }
          `}
        >
          <Map size={18} />
          <span>Mapa</span>
        </button>
      </div>
    </div>
  );
};
