'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Edit2, BarChart3, FileDown, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlacowkaWithCeny {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  powiat: string;
  wojewodztwo: string;
  koszt_pobytu: number | null;
  ceny: {
    rok: number;
    kwota: number;
    typ_kosztu: string;
    zrodlo: string | null;
    verified: boolean;
    data_pobrania: string;
    notatki: string | null;
  }[];
}

interface Stats {
  total: number;
  withPrice2025: number;
  withPrice2024: number;
  missing2025: number;
  avgChange: number;
}

export default function AdminCenyPage() {
  const [placowki, setPlacowki] = useState<PlacowkaWithCeny[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    withPrice2025: 0,
    withPrice2024: 0,
    missing2025: 0,
    avgChange: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState(2025);
  const [search, setSearch] = useState('');
  const [wojewodztwo, setWojewodztwo] = useState('');
  const [typ, setTyp] = useState('');
  const [missingPrice, setMissingPrice] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const wojewodztwa = [
    'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
    'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
    'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
    'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedYear, search, wojewodztwo, typ, missingPrice, unverified]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        rok: selectedYear.toString(),
        ...(search && { search }),
        ...(wojewodztwo && { wojewodztwo }),
        ...(typ && { typ }),
        ...(missingPrice && { missingPrice: 'true' }),
        ...(unverified && { unverified: 'true' })
      });

      const response = await fetch(`/api/admin/ceny?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPlacowki(data.placowki);
        setStats(data.stats);
      } else {
        toast.error('Błąd podczas pobierania danych');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const getPriceForYear = (placowka: PlacowkaWithCeny, rok: number) => {
    return placowka.ceny.find(c => c.rok === rok);
  };

  const calculateYoYChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const wojewodztwoShort = (woj: string) => {
    const mapping: { [key: string]: string } = {
      'dolnośląskie': 'Dol',
      'kujawsko-pomorskie': 'Kuj-Pom',
      'lubelskie': 'Lub',
      'lubuskie': 'Lbs',
      'łódzkie': 'Łdz',
      'małopolskie': 'Mał',
      'mazowieckie': 'Maz',
      'opolskie': 'Opol',
      'podkarpackie': 'Pkr',
      'podlaskie': 'Pdl',
      'pomorskie': 'Pom',
      'śląskie': 'Śl',
      'świętokrzyskie': 'Świę',
      'warmińsko-mazurskie': 'War-Maz',
      'wielkopolskie': 'Wlkp',
      'zachodniopomorskie': 'Zach-Pom'
    };
    return mapping[woj] || woj.substring(0, 3);
  };

  const clearFilters = () => {
    setSearch('');
    setWojewodztwo('');
    setTyp('');
    setMissingPrice(false);
    setUnverified(false);
  };

  const activeFiltersCount = [
    search,
    wojewodztwo,
    typ,
    missingPrice,
    unverified
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zarządzanie cenami</h1>
            <p className="mt-2 text-gray-600">
              Przeglądaj i zarządzaj cenami placówek rok do roku
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast('Import CSV - funkcja w przygotowaniu')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <Link
              href={`/api/admin/ceny/export?rok=${selectedYear}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <FileDown className="w-4 h-4" />
              Eksport CSV
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Total placówek</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Z ceną {selectedYear}</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.withPrice2025}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Z ceną {selectedYear - 1}</div>
            <div className="text-2xl font-bold text-gray-600">{stats.withPrice2024}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Brak ceny {selectedYear}</div>
            <div className="text-2xl font-bold text-red-600">{stats.missing2025}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Średnia zmiana YoY</div>
            <div className={`text-2xl font-bold ${stats.avgChange > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {stats.avgChange > 0 ? '+' : ''}{stats.avgChange.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rok</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Szukaj</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nazwa lub miejscowość..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Województwo</label>
            <select
              value={wojewodztwo}
              onChange={(e) => setWojewodztwo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Wszystkie</option>
              {wojewodztwa.map(woj => (
                <option key={woj} value={woj}>{woj}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
            <select
              value={typ}
              onChange={(e) => setTyp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Wszystkie</option>
              <option value="DPS">DPS</option>
              <option value="ŚDS">ŚDS</option>
            </select>
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={missingPrice}
                onChange={(e) => setMissingPrice(e.target.checked)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Tylko bez ceny</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={unverified}
                onChange={(e) => setUnverified(e.target.checked)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Tylko niezweryfikowane</span>
            </label>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Wyczyść filtry ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Ładowanie danych...</div>
        ) : placowki.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Brak danych do wyświetlenia</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nazwa / Miejscowość
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Woj
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedYear - 1}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedYear}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Źródło
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {placowki.map((placowka) => {
                  const currentPrice = getPriceForYear(placowka, selectedYear);
                  const previousPrice = getPriceForYear(placowka, selectedYear - 1);
                  const yoyChange = currentPrice && previousPrice
                    ? calculateYoYChange(currentPrice.kwota, previousPrice.kwota)
                    : null;

                  return (
                    <tr key={placowka.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {placowka.id}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{placowka.nazwa}</div>
                        <div className="text-sm text-gray-500">{placowka.miejscowosc}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                          {wojewodztwoShort(placowka.wojewodztwo)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {previousPrice ? (
                          previousPrice.kwota === 0 && placowka.typ_placowki === 'ŚDS' ? (
                            <span className="text-blue-600 font-medium">NFZ</span>
                          ) : (
                            `${previousPrice.kwota.toLocaleString('pl-PL')} zł`
                          )
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        {currentPrice ? (
                          <div className="flex items-center justify-end gap-2">
                            {currentPrice.kwota === 0 && placowka.typ_placowki === 'ŚDS' ? (
                              <span className="text-blue-600 font-bold">NFZ</span>
                            ) : (
                              <span className="font-bold text-gray-900">
                                {currentPrice.kwota.toLocaleString('pl-PL')} zł
                              </span>
                            )}
                            {yoyChange !== null && currentPrice.kwota > 0 && (
                              <span className={`flex items-center gap-1 text-xs ${yoyChange > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {yoyChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {currentPrice ? (
                            <>
                              {currentPrice.verified ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              )}
                              {currentPrice.zrodlo && (
                                <a
                                  href={currentPrice.zrodlo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  PDF
                                </a>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toast('Edycja - funkcja w przygotowaniu')}
                            className="text-gray-600 hover:text-emerald-600"
                            title="Edytuj"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/ceny/${placowka.id}/historia`}
                            className="text-gray-600 hover:text-blue-600"
                            title="Historia cen"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
