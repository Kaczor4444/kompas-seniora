'use client';

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { isFavorite, addFavorite, removeFavorite, type FavoriteFacility } from '@/src/utils/favorites';

interface FavoriteButtonProps {
  facility: FavoriteFacility;
  variant?: 'default' | 'compact' | 'icon-only';
}

export default function FavoriteButton({ facility, variant = 'default' }: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(isFavorite(facility.id));

    const handleFavoritesChange = () => {
      setIsFav(isFavorite(facility.id));
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    window.addEventListener('storage', handleFavoritesChange);

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
      window.removeEventListener('storage', handleFavoritesChange);
    };
  }, [facility.id]);

  const handleClick = () => {
    if (isFav) {
      const result = removeFavorite(facility.id);
      if (result.success) {
        setIsFav(false);
        toast.success(`Usunięto ${facility.nazwa} z ulubionych`, {
          icon: '💔',
          duration: 2000,
        });
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      } else {
        toast.error(result.message);
      }
    } else {
      const result = addFavorite(facility);
      if (result.success) {
        setIsFav(true);
        toast.success(`Dodano ${facility.nazwa} do ulubionych`, {
          icon: '❤️',
          duration: 2000,
        });
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      } else {
        toast.error(result.message);
      }
    }
  };

  // Icon-only variant (for search results)
  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-full transition-all ${
          isFav 
            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500'
        }`}
        title={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      >
        {isFav ? (
          <HeartIconSolid className="w-5 h-5" />
        ) : (
          <HeartIcon className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
          isFav 
            ? 'bg-red-50 text-red-600 border-2 border-red-500 hover:bg-red-100' 
            : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-red-500 hover:text-red-600'
        }`}
      >
        {isFav ? (
          <>
            <HeartIconSolid className="w-4 h-4" />
            <span className="text-sm">Usuń</span>
          </>
        ) : (
          <>
            <HeartIcon className="w-4 h-4" />
            <span className="text-sm">Dodaj</span>
          </>
        )}
      </button>
    );
  }

  // Default variant (large, for detail pages)
  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
        isFav 
          ? 'bg-red-50 text-red-600 border-2 border-red-500 hover:bg-red-100' 
          : 'bg-white text-accent-600 border-2 border-accent-500 hover:bg-accent-50'
      }`}
    >
      {isFav ? (
        <>
          <HeartIconSolid className="w-6 h-6" />
          Usuń z ulubionych
        </>
      ) : (
        <>
          <HeartIcon className="w-6 h-6" />
          ⭐ Dodaj do ulubionych placówek
        </>
      )}
    </button>
  );
}
