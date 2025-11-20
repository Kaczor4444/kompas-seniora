'use client';

import { MapPin, TrendingUp, Building2, Activity } from 'lucide-react';

interface GeographicInsightsProps {
  data: {
    byCity: Array<{
      city: string;
      wojewodztwo: string;
      totalEvents: number;
      views: number;
      contacts: number;
      facilitiesCount: number;
      viewsPerFacility: number;
      demandLevel: 'high' | 'medium' | 'low';
    }>;
    topCities: Array<{
      city: string;
      wojewodztwo: string;
      totalEvents: number;
      views: number;
      contacts: number;
      facilitiesCount: number;
      viewsPerFacility: number;
      demandLevel: 'high' | 'medium' | 'low';
    }>;
    highDemandCities: Array<{
      city: string;
      wojewodztwo: string;
      totalEvents: number;
      views: number;
      contacts: number;
      facilitiesCount: number;
      viewsPerFacility: number;
      demandLevel: 'high' | 'medium' | 'low';
    }>;
  };
}

export default function GeographicInsights({ data }: GeographicInsightsProps) {
  const { topCities, highDemandCities } = data;

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDemandLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Wysokie zapotrzebowanie';
      case 'medium': return 'Średnie zapotrzebowanie';
      case 'low': return 'Niskie zapotrzebowanie';
      default: return 'Brak danych';
    }
  };

  const maxViews = Math.max(...topCities.map(c => c.views), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl border border-blue-200">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analiza Geograficzna</h2>
          <p className="text-sm text-gray-500">Popyt na placówki w różnych miastach</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Aktywne miasta</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{topCities.length}</p>
          <p className="text-sm text-gray-500 mt-1">z aktywnością w wybranym okresie</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Wysokie zapotrzebowanie</h3>
          </div>
          <p className="text-4xl font-bold text-red-600">{highDemandCities.length}</p>
          <p className="text-sm text-gray-500 mt-1">&gt;10 wyświetleń na placówkę</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Najaktywniejsze miasto</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{topCities[0]?.city || 'N/A'}</p>
          <p className="text-sm text-gray-500 mt-1">{topCities[0]?.views || 0} wyświetleń</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cities Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Top 10 Miast według aktywności
          </h3>

          {topCities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak danych geograficznych</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topCities.slice(0, 10).map((city, index) => (
                <div key={`${city.city}-${city.wojewodztwo}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-gray-700 w-5 text-right">{index + 1}.</span>
                      <span className="font-medium text-gray-900 truncate">{city.city}</span>
                      <span className="text-xs text-gray-500">({city.wojewodztwo})</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 ml-2">{city.views}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-6 rounded-full transition-all duration-500"
                        style={{
                          width: `${(city.views / maxViews) * 100}%`,
                          minWidth: city.views > 0 ? '20px' : '0'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap w-20 text-right">
                      {city.facilitiesCount} {city.facilitiesCount === 1 ? 'placówka' : 'placówki'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demand/Supply Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Wskaźnik Zapotrzebowania
          </h3>

          {topCities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak danych o zapotrzebowaniu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topCities.slice(0, 10).map((city) => (
                <div 
                  key={`${city.city}-${city.wojewodztwo}-demand`}
                  className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {city.city}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {city.views} wyśw.
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {city.facilitiesCount} placówek
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-lg font-bold text-gray-900">
                        {city.viewsPerFacility}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getDemandColor(city.demandLevel)}`}>
                        {city.demandLevel === 'high' ? '🔥' : city.demandLevel === 'medium' ? '⚡' : '✓'} 
                        {' '}{city.demandLevel.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Poziomy zapotrzebowania:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-red-100 border border-red-200 rounded"></span>
                <span><strong>Wysokie:</strong> &gt;10 wyświetleń/placówkę</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></span>
                <span><strong>Średnie:</strong> 5-10 wyświetleń/placówkę</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 border border-green-200 rounded"></span>
                <span><strong>Niskie:</strong> &lt;5 wyświetleń/placówkę</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
