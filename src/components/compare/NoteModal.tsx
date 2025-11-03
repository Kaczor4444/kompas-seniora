'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StarRating from '../StarRating';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  rating: number;
  notes: string;
}

export default function NoteModal({
  isOpen,
  onClose,
  facilityName,
  rating,
  notes
}: NoteModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-gray-900 leading-tight pr-8"
                    >
                      {facilityName}
                    </Dialog.Title>
                    <div className="mt-2">
                      <StarRating rating={rating} readonly size="sm" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      📝 Twoja notatka:
                    </h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto break-words">
                      {notes}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-4 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
                  >
                    Zamknij
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}