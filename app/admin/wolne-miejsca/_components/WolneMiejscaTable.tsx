'use client';

import { useState, useMemo, Fragment } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown, Filter } from 'lucide-react';

type Snapshot = {
  data_stanu: string; // ISO date string
  wolne: number;
  oczek: number;
};

type FacilityRow = {
  id: number;
  nazwa: string;
  powiat: string;
  snapshots: Snapshot[]; // posortowane rosnąco po dacie
};

type SortKey = 'nazwa' | 'powiat' | 'wolne_last' | 'oczek_last' | 'wolne_diff' | 'oczek_diff';

function Trend({ diff, inverse = false }: { diff: number; inverse?: boolean }) {
  if (diff === 0) return <Minus size={14} className="text-slate-300" />;
  const positive = inverse ? diff < 0 : diff > 0;
  return positive
    ? <TrendingUp size={14} className="text-emerald-500" />
    : <TrendingDown size={14} className="text-red-400" />;
}

function DiffBadge({ diff, inverse = false }: { diff: number; inverse?: boolean }) {
  if (diff === 0) return <span className="text-slate-300 text-xs">—</span>;
  const positive = inverse ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`text-xs font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {sign}{diff}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WolneMiejscaTable({
  facilities,
  dates,
}: {
  facilities: FacilityRow[];
  dates: string[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>('wolne_diff');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [filterPowiat, setFilterPowiat] = useState('');
  const [onlyChanges, setOnlyChanges] = useState(false);

  const powiaty = useMemo(
    () => ['', ...Array.from(new Set(facilities.map(f => f.powiat))).sort()],
    [facilities]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  }

  const rows = useMemo(() => {
    let list = facilities.map(f => {
      const last = f.snapshots.at(-1);
      const prev = f.snapshots.at(-2);
      const wolne_last = last?.wolne ?? 0;
      const oczek_last = last?.oczek ?? 0;
      const wolne_diff = prev != null ? wolne_last - (prev.wolne ?? 0) : 0;
      const oczek_diff = prev != null ? oczek_last - (prev.oczek ?? 0) : 0;
      return { ...f, wolne_last, oczek_last, wolne_diff, oczek_diff };
    });

    if (filterPowiat) list = list.filter(r => r.powiat === filterPowiat);
    if (onlyChanges) list = list.filter(r => r.wolne_diff !== 0 || r.oczek_diff !== 0);

    list.sort((a, b) => {
      const av = a[sortKey as keyof typeof a] as string | number;
      const bv = b[sortKey as keyof typeof b] as string | number;
      if (typeof av === 'string') return sortDir * av.localeCompare(bv as string, 'pl');
      return sortDir * ((av as number) - (bv as number));
    });

    return list;
  }, [facilities, filterPowiat, onlyChanges, sortKey, sortDir]);

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 font-semibold text-xs uppercase tracking-wide whitespace-nowrap transition-colors ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
      >
        {label}
        <ArrowUpDown size={10} className={active ? 'text-slate-600' : 'text-slate-300'} />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtry */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterPowiat}
            onChange={e => setFilterPowiat(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Wszystkie powiaty</option>
            {powiaty.filter(Boolean).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={e => setOnlyChanges(e.target.checked)}
            className="rounded"
          />
          Tylko ze zmianami
        </label>
        <span className="ml-auto text-xs text-slate-400">{rows.length} placówek</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-4 py-3 bg-slate-50">
                  <SortHeader label="Nazwa" k="nazwa" />
                </th>
                <th className="text-left px-4 py-3 bg-slate-50 hidden md:table-cell">
                  <SortHeader label="Powiat" k="powiat" />
                </th>
                {dates.map(d => (
                  <th key={d} colSpan={2} className="text-center px-3 py-3 bg-slate-50 border-l border-stone-100">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{formatDate(d)}</span>
                  </th>
                ))}
                {dates.length >= 2 && (
                  <th colSpan={2} className="text-center px-3 py-3 bg-blue-50 border-l border-blue-100">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Zmiana</span>
                  </th>
                )}
              </tr>
              <tr className="border-b border-stone-100">
                <th className="px-4 py-2 bg-slate-50" />
                <th className="px-4 py-2 bg-slate-50 hidden md:table-cell" />
                {dates.map(d => (
                  <Fragment key={d}>
                    <th className="text-center px-2 py-2 bg-slate-50 border-l border-stone-100">
                      <span className="text-[10px] text-slate-400">Wolne</span>
                    </th>
                    <th className="text-center px-2 py-2 bg-slate-50">
                      <span className="text-[10px] text-slate-400">Kolejka</span>
                    </th>
                  </Fragment>
                ))}
                {dates.length >= 2 && (
                  <>
                    <th className="text-center px-2 py-2 bg-blue-50 border-l border-blue-100">
                      <SortHeader label="Wolne" k="wolne_diff" />
                    </th>
                    <th className="text-center px-2 py-2 bg-blue-50">
                      <SortHeader label="Kolejka" k="oczek_diff" />
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-stone-50 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-stone-50/30'}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-[220px]">
                    <div className="truncate">{row.nazwa}</div>
                    <div className="text-xs text-slate-400 md:hidden">{row.powiat}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{row.powiat}</td>

                  {dates.map(d => {
                    const snap = row.snapshots.find(s => s.data_stanu === d);
                    return (
                      <Fragment key={d}>
                        <td className="text-center px-2 py-3 border-l border-stone-100 tabular-nums">
                          {snap != null ? (
                            <span className={snap.wolne > 0 ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                              {snap.wolne}
                            </span>
                          ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="text-center px-2 py-3 tabular-nums">
                          {snap != null ? (
                            <span className={snap.oczek > 0 ? 'text-amber-600' : 'text-slate-400'}>
                              {snap.oczek}
                            </span>
                          ) : <span className="text-slate-200">—</span>}
                        </td>
                      </Fragment>
                    );
                  })}

                  {dates.length >= 2 && (
                    <>
                      <td className="text-center px-3 py-3 bg-blue-50/30 border-l border-blue-100">
                        <div className="flex items-center justify-center gap-1">
                          <Trend diff={row.wolne_diff} />
                          <DiffBadge diff={row.wolne_diff} />
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 bg-blue-50/30">
                        <div className="flex items-center justify-center gap-1">
                          <Trend diff={row.oczek_diff} inverse />
                          <DiffBadge diff={row.oczek_diff} inverse />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
