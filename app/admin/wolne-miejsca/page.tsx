import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isValidAdminCookie } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { ChevronRight, Database, TrendingUp, TrendingDown, Users } from 'lucide-react';
import WolneMiejscaTable from './_components/WolneMiejscaTable';

export const dynamic = 'force-dynamic';

export default async function WolneMiejscaPage() {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get('admin-auth')?.value)) {
    redirect('/admin/login');
  }

  // Znajdź 2 ostatnie daty snapshotów
  const latestDates = await prisma.placowkaWolneMiejsca.findMany({
    where: { placowka: { typ_placowki: 'DPS', wojewodztwo: 'małopolskie' } },
    distinct: ['data_stanu'],
    orderBy: { data_stanu: 'desc' },
    take: 2,
    select: { data_stanu: true },
  });
  const dateFilter = latestDates.map(r => r.data_stanu);

  // Pobierz rekordy tylko dla 2 ostatnich dat
  const records = await prisma.placowkaWolneMiejsca.findMany({
    where: {
      placowka: { typ_placowki: 'DPS', wojewodztwo: 'małopolskie' },
      data_stanu: { in: dateFilter },
    },
    orderBy: { data_stanu: 'asc' },
    select: {
      placowkaId: true,
      data_stanu: true,
      wolne_ogolem: true,
      oczekujacych: true,
      placowka: { select: { nazwa: true, powiat: true } },
    },
  });

  // Daty snapshotów (posortowane rosnąco — starszy pierwszy)
  const datesSet = new Set(records.map(r => r.data_stanu.toISOString().split('T')[0]));
  const dates = Array.from(datesSet).sort();

  // Agreguj per (placowkaId, data_stanu) — suma typów opieki
  type AggKey = string;
  const agg = new Map<AggKey, { wolne: number; oczek: number }>();

  for (const r of records) {
    const key = `${r.placowkaId}__${r.data_stanu.toISOString().split('T')[0]}`;
    const prev = agg.get(key) ?? { wolne: 0, oczek: 0 };
    agg.set(key, {
      wolne: prev.wolne + (r.wolne_ogolem ?? 0),
      oczek: prev.oczek + (r.oczekujacych ?? 0),
    });
  }

  // Zbuduj strukturę per placówka
  const facilityMap = new Map<number, { id: number; nazwa: string; powiat: string; snapshots: { data_stanu: string; wolne: number; oczek: number }[] }>();

  for (const r of records) {
    const dateStr = r.data_stanu.toISOString().split('T')[0];
    const key = `${r.placowkaId}__${dateStr}`;
    if (!facilityMap.has(r.placowkaId)) {
      facilityMap.set(r.placowkaId, {
        id: r.placowkaId,
        nazwa: r.placowka.nazwa,
        powiat: r.placowka.powiat ?? '',
        snapshots: [],
      });
    }
    const fac = facilityMap.get(r.placowkaId)!;
    if (!fac.snapshots.find(s => s.data_stanu === dateStr)) {
      const v = agg.get(key)!;
      fac.snapshots.push({ data_stanu: dateStr, wolne: v.wolne, oczek: v.oczek });
    }
  }

  const facilities = Array.from(facilityMap.values()).map(f => ({
    ...f,
    snapshots: f.snapshots.sort((a, b) => a.data_stanu.localeCompare(b.data_stanu)),
  }));

  // Statystyki podsumowania
  const lastDate = dates.at(-1);
  const prevDate = dates.at(-2);

  let totalWolne = 0, totalOczek = 0, totalWolnePrev = 0, totalOczekPrev = 0;
  let withWolne = 0, withOczek = 0;

  for (const f of facilities) {
    const last = f.snapshots.find(s => s.data_stanu === lastDate);
    const prev = f.snapshots.find(s => s.data_stanu === prevDate);
    if (last) {
      totalWolne += last.wolne;
      totalOczek += last.oczek;
      if (last.wolne > 0) withWolne++;
      if (last.oczek > 0) withOczek++;
    }
    if (prev) {
      totalWolnePrev += prev.wolne;
      totalOczekPrev += prev.oczek;
    }
  }

  const diffWolne = totalWolne - totalWolnePrev;
  const diffOczek = totalOczek - totalOczekPrev;

  const summaryStats = [
    {
      label: 'Wolne miejsca łącznie',
      value: totalWolne,
      diff: prevDate ? diffWolne : null,
      icon: Database,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      positiveIsGood: true,
    },
    {
      label: 'Oczekujących łącznie',
      value: totalOczek,
      diff: prevDate ? diffOczek : null,
      icon: Users,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      positiveIsGood: false,
    },
    {
      label: 'Placówki z wolnymi',
      value: withWolne,
      diff: null,
      icon: TrendingUp,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      positiveIsGood: true,
    },
    {
      label: 'Placówki z kolejką',
      value: withOczek,
      diff: null,
      icon: TrendingDown,
      color: 'text-red-700',
      bg: 'bg-red-50',
      positiveIsGood: false,
    },
  ];

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-700 transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-slate-600 font-medium">Wolne miejsca DPS</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Monitoring MUW Małopolska</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wolne miejsca DPS</h1>
          <p className="text-sm text-slate-500 mt-1">
            {dates.length} {dates.length === 1 ? 'snapshot' : 'snapshoty'} · dane z rejestru MUW Małopolska
          </p>
        </div>
        <div className="text-right text-xs text-slate-400 shrink-0">
          {lastDate && (
            <>
              <div className="font-semibold text-slate-600">Ostatni import</div>
              <div>{formatDate(lastDate)}</div>
            </>
          )}
        </div>
      </div>

      {/* Daty snapshotów */}
      <div className="flex flex-wrap gap-2">
        {dates.map((d, i) => (
          <div key={d} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${i === dates.length - 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-stone-200'}`}>
            {i === dates.length - 1 ? '● ' : '○ '}{formatDate(d)}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map(({ label, value, diff, icon: Icon, color, bg, positiveIsGood }) => {
          const isPositive = diff !== null && diff > 0;
          const trendColor = diff === null || diff === 0
            ? 'text-slate-400'
            : (positiveIsGood ? isPositive : !isPositive)
              ? 'text-emerald-600'
              : 'text-red-500';
          return (
            <div key={label} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={15} className={color} />
              </div>
              <div className="flex items-end gap-2">
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                {diff !== null && diff !== 0 && (
                  <div className={`text-sm font-bold mb-0.5 ${trendColor}`}>
                    {diff > 0 ? '+' : ''}{diff}
                  </div>
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-tight">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabela */}
      <WolneMiejscaTable facilities={facilities} dates={dates} />

    </div>
  );
}
