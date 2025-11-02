/**
 * Facility Notes & Ratings
 * Stored locally in browser (localStorage)
 * Private to user - never sent to server
 */

export interface FacilityNote {
  facilityId: number;
  notes: string;
  rating: number; // 0-5 (0 = no rating)
  lastUpdated: string;
}

const STORAGE_KEY = 'facility-notes';

/**
 * Get all facility notes
 */
export function getAllNotes(): Record<number, FacilityNote> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading facility notes:', error);
    return {};
  }
}

/**
 * Get note for specific facility
 */
export function getFacilityNote(facilityId: number): FacilityNote | null {
  const allNotes = getAllNotes();
  return allNotes[facilityId] || null;
}

/**
 * Save note for facility
 */
export function saveFacilityNote(
  facilityId: number,
  notes: string,
  rating: number
): { success: boolean; message: string } {
  try {
    // Validate rating
    if (rating < 0 || rating > 5) {
      return {
        success: false,
        message: 'Ocena musi być między 0 a 5'
      };
    }

    const allNotes = getAllNotes();
    
    allNotes[facilityId] = {
      facilityId,
      notes: notes.trim(),
      rating,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('facilityNotesChanged', {
      detail: { facilityId }
    }));

    return {
      success: true,
      message: 'Notatka zapisana'
    };
  } catch (error) {
    console.error('Error saving facility note:', error);
    return {
      success: false,
      message: 'Nie udało się zapisać notatki'
    };
  }
}

/**
 * Delete note for facility
 */
export function deleteFacilityNote(facilityId: number): { success: boolean; message: string } {
  try {
    const allNotes = getAllNotes();
    
    if (!allNotes[facilityId]) {
      return {
        success: false,
        message: 'Notatka nie istnieje'
      };
    }

    delete allNotes[facilityId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('facilityNotesChanged', {
      detail: { facilityId }
    }));

    return {
      success: true,
      message: 'Notatka usunięta'
    };
  } catch (error) {
    console.error('Error deleting facility note:', error);
    return {
      success: false,
      message: 'Nie udało się usunąć notatki'
    };
  }
}

/**
 * Check if facility has note
 */
export function hasFacilityNote(facilityId: number): boolean {
  const note = getFacilityNote(facilityId);
  return note !== null && (note.notes.length > 0 || note.rating > 0);
}

/**
 * Get facilities sorted by rating (highest first)
 */
export function getFacilitiesByRating(facilityIds: number[]): number[] {
  const allNotes = getAllNotes();
  
  return facilityIds.sort((a, b) => {
    const ratingA = allNotes[a]?.rating || 0;
    const ratingB = allNotes[b]?.rating || 0;
    return ratingB - ratingA;
  });
}

/**
 * Export all notes (for backup)
 */
export function exportNotes(): string {
  const allNotes = getAllNotes();
  return JSON.stringify(allNotes, null, 2);
}

/**
 * Import notes (from backup)
 */
export function importNotes(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    window.dispatchEvent(new CustomEvent('facilityNotesChanged'));
    
    return {
      success: true,
      message: 'Notatki zaimportowane'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Nieprawidłowy format danych'
    };
  }
}