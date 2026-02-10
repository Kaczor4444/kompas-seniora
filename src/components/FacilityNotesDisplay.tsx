'use client';

import { useState, useEffect } from 'react';
import { PenLine } from 'lucide-react';
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

  useEffect(() => {
    const loadNote = () => {
      setNote(getFacilityNote(facilityId));
    };

    loadNote();

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
    return (
      <div className="mt-2">
        {hasNote ? (
          <div
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer space-y-1.5"
          >
            {note.rating > 0 && (
              <StarRating rating={note.rating} readonly size="sm" />
            )}
            {note.notes.length > 0 && (
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                {note.notes.length > 200 ? note.notes.slice(0, 200) + '…' : note.notes}
              </p>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 font-medium transition-colors">
              <PenLine className="w-3.5 h-3.5" />
              {note.notes.length > 0 ? 'Edytuj notatkę' : 'Dodaj notatkę'}
            </span>
          </div>
        ) : (
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 font-medium cursor-pointer transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" />
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
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-800 mb-1 font-serif">
            {hasNote ? 'Twoje notatki' : 'Dodaj prywatną notatkę'}
          </h3>
          {note?.rating > 0 && (
            <StarRating rating={note.rating} readonly size="sm" />
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:border-primary-300 hover:text-primary-700 text-slate-600 rounded-xl transition-colors text-sm font-bold"
        >
          <PenLine className="w-4 h-4" />
          {hasNote ? 'Edytuj' : 'Dodaj'}
        </button>
      </div>

      {note?.notes && note.notes.length > 0 ? (
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {note.notes}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">
          Dodaj prywatne notatki i ocenę aby śledzić kontakt z tą placówką
        </p>
      )}

      {note?.lastUpdated && (
        <p className="text-xs text-slate-400 mt-3">
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
