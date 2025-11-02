// src/utils/favorites.ts
// Utility do zarządzania ulubionymi placówkami (localStorage)

export interface FavoriteFacility {
  id: number;
  nazwa: string;
  miejscowosc: string;
  powiat: string;
  typ_placowki: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  // ➕ NOWE POLA - takie same jak w SearchResults
  ulica: string | null;
  kod_pocztowy: string | null;
  email: string | null;
  www: string | null;
  liczba_miejsc: number | null;
  profil_opieki: string | null;
  addedAt: string;
}

const STORAGE_KEY = 'kompas-seniora-favorites';
const MAX_FAVORITES = 5;

export function getFavorites(): FavoriteFacility[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const favorites = JSON.parse(stored) as FavoriteFacility[];
    return favorites;
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function isFavorite(facilityId: number): boolean {
  const favorites = getFavorites();
  return favorites.some(f => f.id === facilityId);
}

export function addFavorite(facility: FavoriteFacility): { success: boolean; message: string } {
  const favorites = getFavorites();
  
  if (favorites.some(f => f.id === facility.id)) {
    return {
      success: false,
      message: 'Ta placówka jest już w ulubionych'
    };
  }
  
  if (favorites.length >= MAX_FAVORITES) {
    return {
      success: false,
      message: `Możesz dodać maksymalnie ${MAX_FAVORITES} placówek do ulubionych`
    };
  }
  
  const newFavorite = {
    ...facility,
    addedAt: new Date().toISOString()
  };
  
  try {
    const updated = [...favorites, newFavorite];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    return {
      success: true,
      message: `Dodano ${facility.nazwa} do ulubionych`
    };
  } catch (error) {
    console.error('Error adding favorite:', error);
    return {
      success: false,
      message: 'Nie udało się dodać do ulubionych'
    };
  }
}

export function removeFavorite(facilityId: number): { success: boolean; message: string } {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter(f => f.id !== facilityId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    return {
      success: true,
      message: 'Usunięto z ulubionych'
    };
  } catch (error) {
    console.error('Error removing favorite:', error);
    return {
      success: false,
      message: 'Nie udało się usunąć z ulubionych'
    };
  }
}

export function getFavoritesCount(): number {
  return getFavorites().length;
}

export function clearAllFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getMaxFavorites(): number {
  return MAX_FAVORITES;
}