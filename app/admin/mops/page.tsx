'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface MopsRecord {
  id: number;
  city: string;
  cityDisplay: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  website: string | null;
  wojewodztwo: string;
  verified: boolean;
  lastVerified: string | null;
  notes: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const WOJEWODZTWA = [
  'małopolskie', 'śląskie', 'mazowieckie', 'dolnośląskie',
  'wielkopolskie', 'łódzkie', 'podkarpackie', 'lubelskie',
];

export default function AdminMopsPage() {
  const [records, setRecords]       = useState<MopsRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [woj, setWoj]               = useState('');
  const [verified, setVerified]     = useState('');
  const [page, setPage]             = useState(1);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '25',
      search,
      ...(woj      ? { wojewodztwo: woj } : {}),
      ...(verified ? { verified }         : {}),
    });
    const res = await fetch(`/api/admin/mops?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRecords(data.mops);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, search, woj, verified]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, woj, verified]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/mops/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteId(null);
      fetchData();
    }
    setDeleting(false);
  };

  const activeFilters = [search, woj, verified].filter(Boolean).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MOPS / GOPS</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ośrodki Pomocy Społecznej — {pagination.total} wpisów
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Odśwież
          </button>
          <Link href="/admin/mops/dodaj"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Dodaj MOPS/GOPS
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj po mieście, nazwie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={woj}
            onChange={e => setWoj(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Wszystkie województwa</option>
            {WOJEWODZTWA.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select
            value={verified}
            onChange={e => setVerified(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Wszystkie statusy</option>
            <option value="true">✅ Zweryfikowane</option>
            <option value="false">⏳ Niezweryfikowane</option>
          </select>
          {activeFilters > 0 && (
            <button onClick={() => { setSearch(''); setWoj(''); setVerified(''); }}
              className="text-sm text-red-600 hover:text-red-800 font-medium">
              Wyczyść filtry ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">Ładowanie...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            {activeFilters > 0 ? 'Brak wyników dla podanych filtrów.' : 'Brak wpisów MOPS/GOPS.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miasto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adres</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WWW</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zweryfikowany</th>
                  <th className="sticky right-0 bg-gray-50 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.08)]">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{r.cityDisplay}</span>
                      <span className="block text-xs text-gray-400">{r.wojewodztwo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px]">
                      <span className="block truncate">{r.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                      <span className="block truncate">{r.address}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{r.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {r.verified ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          {r.lastVerified ? new Date(r.lastVerified).toLocaleDateString('pl-PL') : 'tak'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500">
                          <XCircle className="h-4 w-4" /> nie
                        </span>
                      )}
                    </td>
                    <td className="sticky right-0 bg-white group-hover:bg-gray-50 px-4 py-3 text-right whitespace-nowrap shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.08)]">
                      <Link href={`/admin/mops/${r.id}/edytuj`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 mr-2">
                        <Edit className="h-3 w-3" /> Edytuj
                      </Link>
                      <button onClick={() => setDeleteId(r.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100">
                        <Trash2 className="h-3 w-3" /> Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Strona {pagination.page} z {pagination.pages} ({pagination.total} wpisów)
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-white">
                  ← Poprzednia
                </button>
                <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-white">
                  Następna →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Usuń wpis</h3>
                <p className="text-sm text-gray-500">
                  {records.find(r => r.id === deleteId)?.cityDisplay} — {records.find(r => r.id === deleteId)?.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">Tej operacji nie można cofnąć.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Anuluj
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Usuwam...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
