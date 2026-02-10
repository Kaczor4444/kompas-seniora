'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, PenLine, Lock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import { saveFacilityNote, getFacilityNote, deleteFacilityNote } from '@/src/utils/facilityNotes';

interface FacilityNotesModalProps {
  facilityId: number;
  facilityName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FacilityNotesModal({
  facilityId,
  facilityName,
  isOpen,
  onClose
}: FacilityNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingNote = getFacilityNote(facilityId);
      if (existingNote) {
        setNotes(existingNote.notes);
        setRating(existingNote.rating);
      } else {
        setNotes('');
        setRating(0);
      }
    }
  }, [isOpen, facilityId]);

  const handleSave = () => {
    setIsSaving(true);
    const result = saveFacilityNote(facilityId, notes, rating);
    if (result.success) {
      toast.success('Notatka zapisana!', { duration: 2000 });
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (!confirm('Czy na pewno chcesz usunąć notatkę i ocenę?')) return;
    const result = deleteFacilityNote(facilityId);
    if (result.success) {
      toast.success('Notatka usunięta', { duration: 2000 });
      setNotes('');
      setRating(0);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const hasExistingNote = getFacilityNote(facilityId) !== null;
  const hasChanges = notes.trim().length > 0 || rating > 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">

                {/* Colored header */}
                <div className="bg-primary-600 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <PenLine className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-white font-serif font-bold text-lg leading-tight">
                        Notatki i ocena
                      </Dialog.Title>
                      <p className="text-primary-100 text-xs mt-0.5 truncate max-w-[280px]">{facilityName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-6">

                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                      Twoja ocena
                    </label>
                    <StarRating rating={rating} onChange={setRating} size="lg" showLabel />
                    <p className="text-xs text-slate-400 mt-2">Ocena jest prywatna — tylko Ty ją widzisz</p>
                  </div>

                  {/* Notes textarea */}
                  <div>
                    <label htmlFor="notes" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Twoje notatki
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Np. Dzwoniliśmy 15.11 — bardzo mili. Pani Kowalska nas przyjęła. Lista oczekujących: 2 miesiące..."
                      rows={5}
                      maxLength={2000}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-300 outline-none resize-none transition-all text-sm"
                    />
                    <div className="flex justify-between mt-1.5">
                      <p className="text-xs text-slate-400">Zapisane tylko na tym urządzeniu</p>
                      <p className={`text-xs font-medium ${notes.length > 1800 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {notes.length} / 2000
                      </p>
                    </div>
                  </div>

                  {/* Privacy info */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start gap-3">
                    <Lock size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <strong className="text-slate-700">Prywatność:</strong> Twoje notatki i oceny są przechowywane
                      wyłącznie na tym urządzeniu. Nie wysyłamy ich na serwer i nie mamy do nich dostępu.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100">
                    <div>
                      {hasExistingNote && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-stone-100 rounded-xl transition-colors font-bold text-sm"
                        >
                          <Trash2 size={15} /> Usuń notatkę
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 hover:bg-stone-100 rounded-xl transition-colors font-bold text-sm"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                      >
                        {isSaving ? 'Zapisuję...' : 'Zapisz'}
                      </button>
                    </div>
                  </div>

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
