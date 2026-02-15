'use client';

import { Globe } from 'lucide-react';

interface LanguageItem {
  language: string;
  count: number;
  percent: number;
}

interface LanguageStatsProps {
  data: LanguageItem[];
}

const LANGUAGE_NAMES: Record<string, string> = {
  'pl': 'Polski',
  'pl-PL': 'Polski (Polska)',
  'en': 'Angielski',
  'en-US': 'Angielski (USA)',
  'en-GB': 'Angielski (UK)',
  'de': 'Niemiecki',
  'de-DE': 'Niemiecki (Niemcy)',
  'fr': 'Francuski',
  'fr-FR': 'Francuski (Francja)',
  'uk': 'Ukraiński',
  'uk-UA': 'Ukraiński (Ukraina)',
  'ru': 'Rosyjski',
  'ru-RU': 'Rosyjski (Rosja)',
  'nl': 'Niderlandzki',
  'nl-NL': 'Niderlandzki (Holandia)',
  'es': 'Hiszpański',
  'it': 'Włoski',
  'unknown': 'Nieznany',
};

function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

function getLanguageColor(code: string, index: number): string {
  const lang = code.split('-')[0].toLowerCase();
  if (lang === 'pl') return 'bg-red-500';
  if (lang === 'en') return 'bg-blue-500';
  if (lang === 'de') return 'bg-yellow-500';
  if (lang === 'uk') return 'bg-blue-400';
  if (lang === 'fr') return 'bg-indigo-500';
  if (lang === 'ru') return 'bg-orange-500';
  const colors = ['bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'];
  return colors[index % colors.length];
}

export default function LanguageStats({ data }: LanguageStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-emerald-600" />
          Języki przeglądarek
        </h2>
        <p className="text-gray-500 text-sm text-center py-8">Brak danych — pojawią się po nowych wizytach</p>
      </div>
    );
  }

  const polishCount = data
    .filter(d => d.language.startsWith('pl'))
    .reduce((sum, d) => sum + d.count, 0);
  const nonPolishCount = data
    .filter(d => !d.language.startsWith('pl') && d.language !== 'unknown')
    .reduce((sum, d) => sum + d.count, 0);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const diasporaPercent = totalCount > 0 ? Math.round((nonPolishCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <Globe className="h-5 w-5 text-emerald-600" />
        Języki przeglądarek
      </h2>
      <p className="text-sm text-gray-500 mb-5">Sygnał zainteresowania z zagranicy</p>

      {/* Diaspora highlight */}
      {nonPolishCount > 0 && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            🌍 {diasporaPercent}% wizyt z przeglądarkami nie-polskimi
            <span className="font-normal text-blue-600 ml-1">({nonPolishCount} z {totalCount} eventów)</span>
          </p>
        </div>
      )}

      {/* Bar chart */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.language} className="flex items-center gap-3">
            <div className="w-36 text-sm text-gray-700 truncate flex-shrink-0">
              {getLanguageName(item.language)}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div
                className={`${getLanguageColor(item.language, index)} h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                style={{ width: `${Math.max(item.percent, 3)}%` }}
              >
                <span className="text-xs font-bold text-white">{item.percent}%</span>
              </div>
            </div>
            <div className="w-12 text-right text-sm font-medium text-gray-600 flex-shrink-0">
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
