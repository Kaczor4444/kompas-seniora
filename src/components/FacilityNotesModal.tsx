'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PencilIcon } from '@heroicons/react/24/solid';
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

  // Load existing note when modal opens
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
      toast.success('Notatka zapisana! 📝', { duration: 2000 });
      onClose();
    } else {
      toast.error(result.message);
    }

    setIsSaving(false);
  };

  const handleDelete = () => {
    if (!confirm('Czy na pewno chcesz usunąć notatkę i ocenę?')) {
      return;
    }

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
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <PencilIcon className="w-6 h-6 text-accent-600" />
                      Notatki i ocena
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 mt-1">{facilityName}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Twoja ocena
                  </label>
                  <StarRating
                    rating={rating}
                    onChange={setRating}
                    size="lg"
                    showLabel
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Ocena jest prywatna - tylko Ty ją widzisz
                  </p>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Twoje notatki
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Np. Dzwoniliśmy 15.11 - bardzo mili. Pani Kowalska nas przyjęła. Lista oczekujących: 2 miesiące..."
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      💡 Notatki są zapisane tylko na tym urządzeniu
                    </p>
                    <p className="text-xs text-gray-500">
                      {notes.length} / 2000
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    🔒 <strong>Prywatność:</strong> Twoje notatki i oceny są przechowywane tylko na tym urządzeniu.
                    Nie wysyłamy ich na serwer i nie mamy do nich dostępu. Możesz usunąć je w każdej chwili.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {hasExistingNote && (
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        Usuń notatkę
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
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