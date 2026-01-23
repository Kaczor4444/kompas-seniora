'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditCenaModalProps {
  placowka: {
    id: number;
    nazwa: string;
    miejscowosc: string;
    typ_placowki: string;
  } | null;
  rok: number;
  currentPrice: {
    kwota: number;
    zrodlo: string | null;
    verified: boolean;
    notatki: string | null;
  } | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditCenaModal({
  placowka,
  rok,
  currentPrice,
  onClose,
  onSave,
}: EditCenaModalProps) {
  const [kwota, setKwota] = useState<string>('');
  const [zrodlo, setZrodlo] = useState<string>('');
  const [notatki, setNotatki] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [selectedRok, setSelectedRok] = useState<number>(rok);

  // Initialize form with current values
  useEffect(() => {
    setSelectedRok(rok); // Reset when modal opens
    if (currentPrice) {
      setKwota(currentPrice.kwota.toString());
      setZrodlo(currentPrice.zrodlo || '');
      setNotatki(currentPrice.notatki || '');
      setVerified(currentPrice.verified);
    } else {
      // New price entry
      setKwota('');
      setZrodlo('');
      setNotatki('');
      setVerified(false);
    }
  }, [currentPrice, rok]);

  // Clear form when year changes
  useEffect(() => {
    if (selectedRok !== rok && placowka) {
      // Clear the form when year changes
      setKwota('');
      setZrodlo('');
      setNotatki('');
      setVerified(false);
    }
  }, [selectedRok, rok, placowka]);

  if (!placowka) return null;

  const handleSave = async () => {
    // Validation
    if (!kwota || isNaN(Number(kwota))) {
      toast.error('Podaj prawidłową kwotę');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/ceny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            {
              placowkaId: placowka.id,
              rok: selectedRok,
              kwota: Number(kwota),
              zrodlo: zrodlo || null,
              notatki: notatki || null,
              verified,
              typ_kosztu: 'podstawowy',
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Błąd podczas zapisywania');
      }

      toast.success('Cena została zapisana');
      onSave();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  const isSDSFree = placowka.typ_placowki === 'ŚDS' && kwota === '0';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentPrice ? `Edytuj cenę za ${selectedRok}` : `Dodaj cenę za ${selectedRok}`}
              </h3>
              <p className="text-sm text-gray-600">
                {placowka.nazwa} • Rok {selectedRok}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Rok */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rok *
            </label>
            <select
              value={selectedRok}
              onChange={(e) => setSelectedRok(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Wybierz rok dla którego chcesz dodać/edytować cenę
            </p>
          </div>

          {/* Kwota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kwota miesięczna (zł) *
            </label>
            <input
              type="number"
              value={kwota}
              onChange={(e) => setKwota(e.target.value)}
              placeholder={placowka.typ_placowki === 'ŚDS' ? '0 (NFZ)' : '5000'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
            {isSDSFree && (
              <p className="mt-1 text-xs text-blue-600">
                ℹ️ ŚDS z kwotą 0 będzie wyświetlane jako "NFZ"
              </p>
            )}
          </div>

          {/* Źródło */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Źródło (URL do dokumentu MOPS)
            </label>
            <input
              type="url"
              value={zrodlo}
              onChange={(e) => setZrodlo(e.target.value)}
              placeholder="https://mops.krakow.pl/ceny-2024.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Notatki */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notatki
            </label>
            <textarea
              value={notatki}
              onChange={(e) => setNotatki(e.target.value)}
              placeholder="Dodatkowe informacje..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Verified */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="verified"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
              Zweryfikowane (potwierdzono z oficjalnym źródłem)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
}
