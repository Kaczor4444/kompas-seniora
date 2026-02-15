'use client';

import { MapPin, Search, BarChart2, RefreshCw, Route, MousePointer } from 'lucide-react';

// Mapowanie kodów profili opieki na czytelne opisy
const PROFILE_LABELS: Record<string, string> = {
  A: 'Niepełnosprawność intelektualna',
  B: 'Zaburzenia psychiczne',
  C: 'Zaburzenia psychiczne / niepełnosprawność fizyczna',
  D: 'Podeszły wiek',
  E: 'Podeszły wiek / niewidomi',
  F: 'Przewlekle somatycznie chorzy / niesłyszący',
  G: 'Dzieci niepełnosprawne intelektualnie',
  H: 'Młodzież niepełnosprawna intelektualnie',
  I: 'Niepełnosprawność fizyczna',
};

function mapProfileCode(code: string): string {
  return PROFILE_LABELS[code.trim().toUpperCase()] || code;
}

// Zamienia "powiat+profile" → "Powiat + Podeszły wiek" itp.
function humanizeCombo(combo: string): string {
  return combo
    .split('+')
    .map(part => {
      const mapped = mapProfileCode(part);
      if (mapped !== part) return mapped;
      // Kapitalizuj inne fragmenty
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' + ');
}

interface LocalInsightsData {
  emptyResults: {
    topCombos: Array<{ combo: string; count: number }>;
    total: number;
  };
  filterCombos: {
    topCombos: Array<{ combo: string; count: number }>;
  };
  scrollDepth: Array<{ depth: number; percent: number; count: number }>;
  returnVisitors: { count: number; avgDaysBetween: number };
  crossPowiat: {
    topPaths: Array<{ path: string; count: number }>;
    rate: number;
    total: number;
  };
  pathToContact: {
    avgViews: number;
    distribution: Array<{ views: string; count: number }>;
    totalContacts: number;
  };
}

interface LocalInsightsProps {
  data: LocalInsightsData | null;
}

export default function LocalInsights({ data }: LocalInsightsProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Lokalne insighty — Małopolska</h2>
        <p className="text-sm text-gray-500 py-4 text-center">Brak danych — pojawią się po nowych wizytach</p>
      </div>
    );
  }

  const maxScrollCount = Math.max(...data.scrollDepth.map(d => d.count), 1);
  const maxPathCount = Math.max(...data.pathToContact.distribution.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-emerald-600" />
        Lokalne insighty — Małopolska
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Cross-powiat */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Route className="h-4 w-4 text-blue-600" />
            Szukanie poza swoim powiatem
          </h3>
          <p className="text-xs text-gray-500 mb-4">Kiedy wybrany powiat ≠ powiat oglądanej placówki</p>
          {data.crossPowiat.total === 0 ? (
            <p className="text-sm text-gray-400 py-2">Brak danych</p>
          ) : (
            <>
              <div className="text-3xl font-bold text-blue-600 mb-1">{data.crossPowiat.total}</div>
              <p className="text-xs text-gray-500 mb-4">kliknięć poza wybranym powiatem</p>
              <div className="space-y-2">
                {data.crossPowiat.topPaths.slice(0, 5).map(({ path, count }) => (
                  <div key={path} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{path}</span>
                    <span className="font-semibold text-blue-600">{count}×</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 2. Empty results */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-red-500" />
            Puste wyniki — białe plamy
          </h3>
          <p className="text-xs text-gray-500 mb-4">Kombinacje filtrów które nie dały żadnych wyników</p>
          {data.emptyResults.topCombos.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Brak danych</p>
          ) : (
            <div className="space-y-2">
              {data.emptyResults.topCombos.slice(0, 6).map(({ combo, count }) => (
                <div key={combo} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{humanizeCombo(combo)}</span>
                  <span className="text-sm font-semibold text-red-500">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Path to contact */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <MousePointer className="h-4 w-4 text-emerald-600" />
            Ścieżka do kontaktu
          </h3>
          <p className="text-xs text-gray-500 mb-4">Ile placówek obejrzano zanim zadzwoniono/napisano</p>
          {data.pathToContact.totalContacts === 0 ? (
            <p className="text-sm text-gray-400 py-2">Brak danych</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-emerald-600">{data.pathToContact.avgViews}</span>
                <span className="text-sm text-gray-500">avg. placówek w sesji</span>
              </div>
              <div className="space-y-2">
                {data.pathToContact.distribution.map(({ views, count }) => (
                  <div key={views} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6 text-right">{views}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-4 rounded-full"
                        style={{ width: `${(count / maxPathCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-6">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 4. Scroll depth */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-purple-600" />
            Głębokość scrollowania listy
          </h3>
          <p className="text-xs text-gray-500 mb-4">Jak daleko użytkownicy scrollują wyniki</p>
          {data.scrollDepth.every(d => d.count === 0) ? (
            <p className="text-sm text-gray-400 py-2">Brak danych</p>
          ) : (
            <div className="space-y-3">
              {data.scrollDepth.map(({ depth, count, percent }) => (
                <div key={depth} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">{depth}%</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-5 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((count / maxScrollCount) * 100, 3)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{percent}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-8">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Return visitors */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-orange-500" />
            Powracający użytkownicy
          </h3>
          <p className="text-xs text-gray-500 mb-4">Sygnał że decyzja zajmuje czas (bez cookies)</p>
          {data.returnVisitors.count === 0 ? (
            <p className="text-sm text-gray-400 py-2">Brak danych</p>
          ) : (
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-bold text-orange-500">{data.returnVisitors.count}</div>
                <div className="text-xs text-gray-500 mt-1">powrotów</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-400">{data.returnVisitors.avgDaysBetween}</div>
                <div className="text-xs text-gray-500 mt-1">dni między wizytami (avg)</div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Filter combinations */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-teal-600" />
            Popularne kombinacje filtrów
          </h3>
          <p className="text-xs text-gray-500 mb-4">Co ludzie najczęściej łączą przy szukaniu</p>
          {data.filterCombos.topCombos.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Brak danych</p>
          ) : (
            <div className="space-y-2">
              {data.filterCombos.topCombos.slice(0, 6).map(({ combo, count }) => (
                <div key={combo} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-700 bg-gray-50 px-2 py-0.5 rounded">{humanizeCombo(combo)}</span>
                  <span className="text-sm font-semibold text-teal-600 flex-shrink-0">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
