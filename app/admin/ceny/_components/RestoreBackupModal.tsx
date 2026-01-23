'use client';

import { useState, ChangeEvent } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface RestoreBackupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface BackupRow {
  id: string;
  wojewodztwo: string;
  powiat: string;
  miejscowosc: string;
  nazwa: string;
  typ_placowki: string;
  cena_2024?: string;
  cena_2025?: string;
  cena_2026?: string;
  zrodlo?: string;
  verified?: string;
  data_aktualizacji?: string;
  notatki?: string;
}

interface RestoreSummary {
  total: number;
  toUpdate: number;
  toCreate: number;
  errors: number;
}

export default function RestoreBackupModal({ onClose, onSuccess }: RestoreBackupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [backupData, setBackupData] = useState<BackupRow[]>([]);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as BackupRow[];

        if (data.length === 0) {
          toast.error('Plik CSV jest pusty');
          setLoading(false);
          return;
        }

        // Validate format
        const firstRow = data[0];
        if (!firstRow.id || !firstRow.nazwa) {
          toast.error('Nieprawidłowy format CSV. Użyj pliku z Export CSV.');
          setLoading(false);
          return;
        }

        setBackupData(data);
        analyzeBackup(data);
      },
      error: (error) => {
        toast.error('Błąd parsowania CSV: ' + error.message);
        setLoading(false);
      }
    });
  };

  const analyzeBackup = async (data: BackupRow[]) => {
    try {
      // Fetch current facilities
      const res = await fetch('/api/admin/placowki?limit=1000');
      const { placowki } = await res.json();

      const placowkiMap = new Map(placowki.map((p: any) => [p.id, p]));

      let toUpdate = 0;
      let toCreate = 0;
      let errors = 0;

      data.forEach(row => {
        const id = parseInt(row.id);
        if (isNaN(id)) {
          errors++;
          return;
        }

        if (placowkiMap.has(id)) {
          toUpdate++;
        } else {
          toCreate++;
        }
      });

      setSummary({
        total: data.length,
        toUpdate,
        toCreate,
        errors
      });

      setStep(2);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Błąd analizy backupu');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setImporting(true);

    try {
      // Prepare updates for each year
      const updates: any[] = [];

      backupData.forEach(row => {
        const placowkaId = parseInt(row.id);
        if (isNaN(placowkaId)) return;

        // Check each year column
        ['2024', '2025', '2026'].forEach(rok => {
          const cenaKey = `cena_${rok}` as keyof BackupRow;
          const cenaValue = row[cenaKey];

          if (cenaValue && cenaValue !== '') {
            const kwota = parseFloat(cenaValue.toString().replace(/[^\d.-]/g, ''));

            if (!isNaN(kwota)) {
              updates.push({
                placowkaId,
                rok: parseInt(rok),
                kwota,
                typ_kosztu: 'podstawowy',
                zrodlo: row.zrodlo || null,
                verified: row.verified === 'TAK',
                notatki: row.notatki || `Restore z backupu - ${new Date().toLocaleDateString('pl-PL')}`,
              });
            }
          }
        });
      });

      // Call bulk update API
      const response = await fetch('/api/admin/ceny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Błąd podczas restore');
      }

      const result = await response.json();

      setStep(3);

      setTimeout(() => {
        toast.success(`Przywrócono ${result.updated} cen z backupu!`);
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Błąd podczas przywracania backupu');
      setStep(2); // Go back to preview
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Przywróć z backupu
              </h3>
              <p className="text-sm text-gray-600">
                Krok {step} z 3
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informacja</h4>
              <p className="text-sm text-blue-800">
                Upload pliku CSV z Export CSV. Format musi zawierać kolumny: id, nazwa, cena_YYYY, zrodlo, verified, notatki.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Kliknij aby wybrać plik
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Tylko pliki CSV z Export CSV
              </p>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Analizowanie backupu...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && summary && (
          <div className="space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Ostrzeżenie
              </h4>
              <p className="text-sm text-amber-800">
                Ta operacja nadpisze istniejące ceny. Upewnij się że masz aktualny backup przed kontynuacją.
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Łącznie</div>
                <div className="text-2xl font-bold text-blue-900">{summary.total}</div>
                <div className="text-xs text-blue-600">placówek w backupie</div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="text-sm text-emerald-600 font-medium">Aktualizacja</div>
                <div className="text-2xl font-bold text-emerald-900">{summary.toUpdate}</div>
                <div className="text-xs text-emerald-600">istniejących placówek</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium">Nowe</div>
                <div className="text-2xl font-bold text-gray-900">{summary.toCreate}</div>
                <div className="text-xs text-gray-600">nowych placówek</div>
              </div>
            </div>

            {summary.errors > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ Znaleziono {summary.errors} błędnych wierszy. Zostaną pominięte.
                </p>
              </div>
            )}

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">
                  Preview: Pierwsze 5 wierszy
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nazwa</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Miejscowość</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Ceny</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backupData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {row.nazwa.substring(0, 40)}...
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{row.miejscowosc}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 text-right">
                          {[row.cena_2024, row.cena_2025, row.cena_2026]
                            .filter(Boolean)
                            .length} lat
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setStep(1)}
                disabled={importing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Wstecz
              </button>
              <button
                onClick={handleRestore}
                disabled={importing || summary.errors === summary.total}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Przywracanie...' : `Przywróć ${summary.total - summary.errors} cen`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Backup przywrócony pomyślnie!
            </h4>
            <p className="text-gray-600">
              Dane zostały zaktualizowane. Strona odświeży się automatycznie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
