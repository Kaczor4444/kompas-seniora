'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, MapPin, CheckCircle, XCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Placowka {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  ulica: string | null;
  powiat: string;
  wojewodztwo: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  data_weryfikacji: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DeleteModalProps {
  placowka: Placowka | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteModal({ placowka, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  if (!placowka) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Usuń placówkę
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Czy na pewno chcesz usunąć placówkę:
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {placowka.nazwa}
            </p>
            <p className="text-sm text-gray-500">
              {placowka.miejscowosc}, {placowka.wojewodztwo}
            </p>
            <p className="mt-2 text-sm text-red-600">
              ⚠️ Ta operacja jest nieodwracalna!
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń placówkę'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListaPlacowekPage() {
  const [placowki, setPlacowki] = useState<Placowka[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [deleteModal, setDeleteModal] = useState<Placowka | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // SEARCH & FILTERS STATE
  const [search, setSearch] = useState('');
  const [typFilter, setTypFilter] = useState('');
  const [wojewodztwoFilter, setWojewodztwoFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [geoFilter, setGeoFilter] = useState(false);

  // Get unique wojewodztwa for dropdown
  const [wojewodztwa, setWojewodztwa] = useState<string[]>([]);

  // Fetch wojewodztwa once on mount
  useEffect(() => {
    fetchWojewodztwa();
  }, []);

  useEffect(() => {
    fetchPlacowki();
  }, [page, limit, search, typFilter, wojewodztwoFilter, verifiedFilter, geoFilter]);

  const fetchWojewodztwa = async () => {
    try {
      const res = await fetch('/api/admin/placowki?limit=1000');
      const data = await res.json();
      if (data.placowki && Array.isArray(data.placowki)) {
        const uniqueWoj = Array.from(
          new Set(data.placowki.map((p: Placowka) => p.wojewodztwo))
        ).sort();
        setWojewodztwa(uniqueWoj as string[]);
      }
    } catch (error) {
      console.error('Error fetching wojewodztwa:', error);
    }
  };

  const fetchPlacowki = async () => {
    setLoading(true);
    try {
      // Build query params with filters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (typFilter) params.append('typ', typFilter);
      if (wojewodztwoFilter) params.append('wojewodztwo', wojewodztwoFilter);
      if (verifiedFilter) params.append('verified', verifiedFilter);

      const res = await fetch(`/api/admin/placowki?${params.toString()}`);
      const data = await res.json();
      setPlacowki(data.placowki || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching placowki:', error);
      toast.error('Błąd podczas ładowania placówek');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/placowki/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Błąd podczas usuwania');
      }

      toast.success(`Placówka "${deleteModal.nazwa}" została usunięta`);
      setDeleteModal(null);
      
      // Refresh list
      await fetchPlacowki();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Błąd podczas usuwania');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setTypFilter('');
    setWojewodztwoFilter('');
    setVerifiedFilter('');
    setGeoFilter(false);
    setPage(1);
  };

  // Count active filters
  const activeFiltersCount = [search, typFilter, wojewodztwoFilter, verifiedFilter, geoFilter].filter(Boolean).length;

  // Apply geo filter client-side
  const filteredPlacowki = geoFilter 
    ? placowki.filter(p => p.latitude && p.longitude)
    : placowki;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Export Buttons */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista placówek</h1>
          <p className="mt-2 text-gray-600">
            {pagination && `${geoFilter ? filteredPlacowki.length : pagination.total} placówek ${activeFiltersCount > 0 ? `(filtrowane)` : 'w bazie'}`}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/admin/export/csv?mode=data"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Eksportuj wszystkie dane do CSV"
          >
            📥 Eksport CSV
          </a>
          <a
            href="/api/admin/export/csv?mode=template"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Pobierz pusty template CSV"
          >
            📄 Template CSV
          </a>
          <Link
            href="/admin/placowki/dodaj"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Dodaj placówkę
          </Link>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Szukaj
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Nazwa lub miejscowość..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Typ Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ placówki
            </label>
            <select
              value={typFilter}
              onChange={(e) => {
                setTypFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Wszystkie</option>
              <option value="DPS">DPS</option>
              <option value="ŚDS">ŚDS</option>
            </select>
          </div>

          {/* Wojewodztwo Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Województwo
            </label>
            <select
              value={wojewodztwoFilter}
              onChange={(e) => {
                setWojewodztwoFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Wszystkie</option>
              {wojewodztwa.map(woj => (
                <option key={woj} value={woj}>{woj}</option>
              ))}
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status weryfikacji
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Wszystkie</option>
              <option value="true">Tylko zweryfikowane</option>
              <option value="false">Tylko niezweryfikowane</option>
            </select>
          </div>

          {/* Geo Filter */}
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={geoFilter}
                onChange={(e) => {
                  setGeoFilter(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Tylko z geolokalizacją
              </span>
            </label>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <div className="flex items-end lg:col-span-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Wyczyść filtry ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Ładowanie...</div>
      ) : filteredPlacowki.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            {activeFiltersCount > 0 
              ? '🔍 Nie znaleziono placówek spełniających kryteria.' 
              : 'Brak placówek w bazie.'}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ulica</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miejscowość</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Geo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Verified</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlacowki.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.nazwa}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        p.typ_placowki === 'DPS' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {p.typ_placowki}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.ulica || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.miejscowosc}</td>
                    <td className="px-6 py-4 text-center">
                      {p.latitude && p.longitude ? (
                        <MapPin className="h-5 w-5 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.verified ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/placowki/${p.id}/edytuj`}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Edytuj"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(p)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Usuń"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && !geoFilter && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Strona {pagination.page} z {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Poprzednia
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Następna
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteModal
          placowka={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}