'use client';

import { useState, ChangeEvent } from 'react';
import { X, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface ImportCSVModalProps {
  selectedYear: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVRow {
  lp: string;
  powiat: string;
  nazwa: string;
  adres?: string;
  typ?: string;
  cena_2024?: string;
  cena_2025?: string;
  cena_2026?: string;
}

interface MatchedRow extends CSVRow {
  matchedPlacowka: any | null;
  matchStatus: 'matched' | 'unmatched' | 'fuzzy';
  cena: number;
}

export default function ImportCSVModal({
  selectedYear,
  onClose,
  onSuccess,
}: ImportCSVModalProps) {
  const [step, setStep] = useState(1);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [matchedData, setMatchedData] = useState<MatchedRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zrodloUrl, setZrodloUrl] = useState('');

  const normalizeNazwa = (nazwa: string): string => {
    return nazwa
      .replace(/Dom Pomocy Społecznej/gi, '')
      .replace(/DPS/gi, '')
      .replace(/im\./gi, '')
      .replace(/św\./gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setPreviewData(data);
        matchWithDatabase(data);
      },
      error: (error) => {
        toast.error('Błąd parsowania CSV: ' + error.message);
        setLoading(false);
      }
    });
  };

  const matchWithDatabase = async (csvData: CSVRow[]) => {
    try {
      // Fetch all placowki
      const res = await fetch('/api/admin/placowki?limit=1000');
      const { placowki } = await res.json();

      // Match each row
      const matched = csvData.map(row => {
        const normalized = normalizeNazwa(row.nazwa);
        const cenaField = `cena_${selectedYear}` as keyof CSVRow;
        const cenaValue = row[cenaField];
        const cena = cenaValue ? parseFloat(cenaValue) : 0;

        // Try exact match first
        let found = placowki.find((p: any) => {
          const pNorm = normalizeNazwa(p.nazwa);
          return pNorm === normalized;
        });

        let status: 'matched' | 'unmatched' | 'fuzzy' = found ? 'matched' : 'unmatched';

        // Try fuzzy match if no exact match
        if (!found) {
          found = placowki.find((p: any) => {
            const pNorm = normalizeNazwa(p.nazwa);
            return pNorm.includes(normalized) || normalized.includes(pNorm);
          });
          if (found) {
            status = 'fuzzy';
          }
        }

        return {
          ...row,
          matchedPlacowka: found || null,
          matchStatus: status,
          cena
        };
      });

      setMatchedData(matched);
      setStep(2);
    } catch (error) {
      console.error('Error matching:', error);
      toast.error('Błąd podczas matchowania placówek');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setStep(3);

    try {
      const updates = matchedData
        .filter(row => row.matchStatus === 'matched' || row.matchStatus === 'fuzzy')
        .map(row => ({
          placowkaId: row.matchedPlacowka.id,
          kwota: row.cena,
          zrodlo: zrodloUrl || null
        }));

      const response = await fetch('/api/admin/ceny/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rok: selectedYear,
          updates,
          zrodlo_domyslne: zrodloUrl
        })
      });

      if (!response.ok) {
        throw new Error('Błąd podczas importu');
      }

      const result = await response.json();
      setImportedCount(result.updated || updates.length);
      toast.success(`Zaimportowano ${updates.length} cen`);

      // Wait a bit before closing to show success message
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Błąd podczas importu');
      setStep(2); // Go back to preview
    } finally {
      setLoading(false);
    }
  };

  const matchedCount = matchedData.filter(r => r.matchStatus === 'matched' || r.matchStatus === 'fuzzy').length;
  const unmatchedCount = matchedData.filter(r => r.matchStatus === 'unmatched').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Import cen z CSV
              </h3>
              <p className="text-sm text-gray-600">
                Rok {selectedYear} • Krok {step}/3
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Wybierz plik CSV
                  </span>
                  <span className="text-gray-600"> lub przeciągnij tutaj</span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Format: lp, powiat, nazwa, cena_{selectedYear}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Wymagany format CSV:</h4>
                <code className="text-xs text-gray-600 block whitespace-pre">
                  lp,powiat,nazwa,cena_2024,cena_2025,cena_2026{'\n'}
                  1,bocheński,Dom Pomocy Społecznej ul. Karolina,5950.00,6499.00,
                </code>
                <a
                  href="/templates/ceny-import-template.csv"
                  download
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  📥 Pobierz szablon CSV
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Źródło (opcjonalne)
                </label>
                <input
                  type="url"
                  value={zrodloUrl}
                  onChange={(e) => setZrodloUrl(e.target.value)}
                  placeholder="https://mops.malopolska.pl/ceny-2025.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL do dokumentu źródłowego (PDF)
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{matchedCount}</div>
                  <div className="text-sm text-green-700">Dopasowanych</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-900">{unmatchedCount}</div>
                  <div className="text-sm text-red-700">Niedopasowanych</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{matchedData.length}</div>
                  <div className="text-sm text-blue-700">Razem</div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lp</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nazwa z CSV</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cena {selectedYear}</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dopasowana placówka</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matchedData.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className={row.matchStatus === 'unmatched' ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.lp}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={row.nazwa}>
                              {row.nazwa.substring(0, 40)}...
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-gray-900">
                            {row.cena.toLocaleString('pl-PL')} zł
                          </td>
                          <td className="px-3 py-2 text-center">
                            {row.matchStatus === 'matched' && (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            )}
                            {row.matchStatus === 'fuzzy' && (
                              <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto" />
                            )}
                            {row.matchStatus === 'unmatched' && (
                              <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {row.matchedPlacowka ? (
                              <div className="max-w-xs truncate" title={row.matchedPlacowka.nazwa}>
                                {row.matchedPlacowka.nazwa}
                              </div>
                            ) : (
                              <span className="text-red-600">Nie znaleziono</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {matchedData.length > 20 && (
                <p className="text-sm text-gray-500 text-center">
                  Pokazano pierwsze 20 z {matchedData.length} wierszy
                </p>
              )}

              {unmatchedCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Uwaga!</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        {unmatchedCount} wierszy nie zostało dopasowanych do placówek w bazie.
                        Zaimportowane zostaną tylko dopasowane rekordy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Importowanie...
                  </h3>
                  <p className="text-gray-600">
                    Proszę czekać, zapisujemy dane do bazy
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ✅ Import zakończony!
                  </h3>
                  <p className="text-gray-600 mb-1">
                    {importedCount} cen zostało zaimportowanych pomyślnie
                  </p>
                  <p className="text-sm text-gray-500">
                    Rok: {selectedYear}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          {step === 1 && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </button>
          )}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Wstecz
              </button>
              <button
                onClick={handleImport}
                disabled={matchedCount === 0 || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importuj {matchedCount} {matchedCount === 1 ? 'cenę' : 'cen'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
