'use client';

import { useState, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import StarRating from './StarRating';
import FacilityNotesModal from './FacilityNotesModal';
import { getFacilityNote, type FacilityNote } from '@/src/utils/facilityNotes';

interface FacilityNotesDisplayProps {
  facilityId: number;
  facilityName: string;
  compact?: boolean;
}

export default function FacilityNotesDisplay({
  facilityId,
  facilityName,
  compact = false
}: FacilityNotesDisplayProps) {
  const [note, setNote] = useState<FacilityNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load note
  useEffect(() => {
    const loadNote = () => {
      setNote(getFacilityNote(facilityId));
    };

    loadNote();

    // Listen for changes
    const handleNotesChanged = (e: CustomEvent) => {
      if (e.detail?.facilityId === facilityId || !e.detail) {
        loadNote();
      }
    };

    window.addEventListener('facilityNotesChanged', handleNotesChanged as EventListener);
    return () => {
      window.removeEventListener('facilityNotesChanged', handleNotesChanged as EventListener);
    };
  }, [facilityId]);

  const hasNote = note !== null && (note.notes.length > 0 || note.rating > 0);

  if (compact) {
    // Compact version for cards
    return (
      <div className="mt-2">
        {hasNote ? (
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-accent-600 hover:text-accent-700 font-medium group cursor-pointer"
          >
            {note.rating > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={note.rating} readonly size="sm" />
              </div>
            )}
            <span className="flex items-center gap-1">
              <PencilIcon className="w-4 h-4" />
              {note.notes.length > 0 ? 'Edytuj notatkę' : 'Dodaj notatkę'}
            </span>
          </div>
        ) : (
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-accent-600 font-medium cursor-pointer"
          >
            <PencilIcon className="w-4 h-4" />
            Dodaj notatkę lub ocenę
          </div>
        )}

        <FacilityNotesModal
          facilityId={facilityId}
          facilityName={facilityName}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  // Full version for detail pages
  return (
    <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {hasNote ? 'Twoje notatki' : 'Dodaj prywatną notatkę'}
          </h3>
          {note?.rating > 0 && (
            <StarRating rating={note.rating} readonly size="sm" />
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-warning-100 hover:bg-warning-200 text-warning-900 rounded-lg transition-colors text-sm font-medium"
        >
          <PencilIcon className="w-4 h-4" />
          {hasNote ? 'Edytuj' : 'Dodaj'}
        </button>
      </div>

      {note?.notes && note.notes.length > 0 ? (
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {note.notes}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Dodaj prywatne notatki i ocenę aby śledzić kontakt z tą placówką
        </p>
      )}

      {note?.lastUpdated && (
        <p className="text-xs text-gray-500 mt-3">
          Ostatnia zmiana: {new Date(note.lastUpdated).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}

      <FacilityNotesModal
        facilityId={facilityId}
        facilityName={facilityName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}