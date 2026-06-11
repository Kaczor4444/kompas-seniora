'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';

export type PowiatStat = {
  powiat: string;
  wolne: number;
  wolnePrev: number | null;
  oczek: number;
  maxCzasDni: number | null;       // tylko profil "podeszły wiek / somatycznie"
  maxCzasSpecDni: number | null;   // profil specjalistyczny (niepełnosprawność)
};

type SortKey = 'powiat' | 'wolne' | 'oczek' | 'maxCzasDni';

function StatusBadge({ wolne, oczek }: { wolne: number; oczek: number }) {
  if (wolne === 0)
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Brak miejsc</span>;
  if (wolne > 0 && oczek === 0)
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Dostępne</span>;
  if (wolne >= oczek)
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Dostępne</span>;
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Kolejka</span>;
}

function TrendCell({ curr, prev }: { curr: number; prev: number | null }) {
  if (prev === null) return <span className="text-slate-300 text-xs">—</span>;
  const diff = curr - prev;
  if (diff === 0) return <div className="flex items-center justify-center gap-1"><Minus size={12} className="text-slate-300" /><span className="text-slate-400 text-xs">0</span></div>;
  const positive = diff > 0;
  return (
    <div className="flex items-center justify-center gap-1">
      {positive
        ? <TrendingUp size={12} className="text-emerald-500" />
        : <TrendingDown size={12} className="text-red-400" />}
      <span className={`text-xs font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {diff > 0 ? '+' : ''}{diff}
      </span>
    </div>
  );
}

function formatCzas(dni: number | null): string {
  if (dni === null || dni === 0) return '—';
  if (dni < 30) return `${dni} dni`;
  const mies = Math.round(dni / 30);
  if (mies < 12) return `~${mies} mies.`;
  const lata = (dni / 365).toFixed(1);
  return `~${lata} lat`;
}

function formatPowiat(p: string) {
  if (p.startsWith('m. ')) return p;
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export default function PowiatTable({ rows, dataStanu }: { rows: PowiatStat[]; dataStanu: string }) {
  const [sortKey, setSortKey] = useState<SortKey>('wolne');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(-1); }
  }

  const sorted = useMemo(() => {
    let list = onlyAvailable ? rows.filter(r => r.wolne > 0) : [...rows];
    list.sort((a, b) => {
      if (sortKey === 'powiat') return sortDir * a.powiat.localeCompare(b.powiat, 'pl');
      const av = (a[sortKey] ?? -1) as number;
      const bv = (b[sortKey] ?? -1) as number;
      return sortDir * (av - bv);
    });
    return list;
  }, [rows, sortKey, sortDir, onlyAvailable]);

  const withWolne = rows.filter(r => r.wolne > 0).length;

  function SortBtn({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
        {label}<ArrowUpDown size={9} className={active ? 'text-slate-600' : 'text-slate-300'} />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} className="rounded" />
          Tylko powiaty z wolnymi miejscami
        </label>
        <span className="ml-auto text-xs text-slate-400">
          {withWolne} z {rows.length} powiatów ma wolne miejsca
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-slate-50">
              <th className="text-left px-4 py-3"><SortBtn label="Powiat" k="powiat" /></th>
              <th className="text-center px-3 py-3"><SortBtn label="Wolne" k="wolne" /></th>
              <th className="text-center px-3 py-3 hidden sm:table-cell">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Trend</span>
              </th>
              <th className="text-center px-3 py-3"><SortBtn label="Kolejka" k="oczek" /></th>
              <th className="text-center px-3 py-3 hidden md:table-cell"><SortBtn label="Max oczekiwanie" k="maxCzasDni" /></th>
              <th className="text-center px-3 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.powiat}
                className={`border-b border-stone-50 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-stone-50/40' : ''}`}>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {formatPowiat(row.powiat)}
                </td>
                <td className="text-center px-3 py-3 tabular-nums">
                  <span className={row.wolne > 0 ? 'text-xl font-black text-emerald-600' : 'text-xl font-black text-slate-300'}>
                    {row.wolne}
                  </span>
                </td>
                <td className="text-center px-3 py-3 hidden sm:table-cell">
                  <TrendCell curr={row.wolne} prev={row.wolnePrev} />
                </td>
                <td className="text-center px-3 py-3 tabular-nums">
                  <span className={row.oczek > 0 ? 'font-semibold text-amber-600' : 'text-slate-400'}>
                    {row.oczek}
                  </span>
                </td>
                <td className="text-center px-3 py-3 text-slate-500 text-xs hidden md:table-cell">
                  {row.maxCzasDni != null && row.maxCzasDni > 0
                    ? formatCzas(row.maxCzasDni)
                    : row.maxCzasSpecDni != null && row.maxCzasSpecDni > 0
                      ? <span className="text-slate-400">{formatCzas(row.maxCzasSpecDni)} *</span>
                      : '—'}
                </td>
                <td className="text-center px-3 py-3">
                  <StatusBadge wolne={row.wolne} oczek={row.oczek} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        * Czas oczekiwania dotyczy wyłącznie profilu specjalistycznego (osoby z niepełnosprawnością intelektualną).
        Dla profilu <em>osoby w podeszłym wieku</em> czas oczekiwania jest zwykle znacznie krótszy.
        Stan na: <strong>{dataStanu}</strong>. Źródło: rejestr MUW Małopolska.
      </p>

      <div className="pt-2">
        <Link
          href="/search?wolneMiejsca=true"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Search size={15} />
          Znajdź DPS z wolnym miejscem
        </Link>
      </div>
    </div>
  );
}
