'use client';

import { TrendingUp, Users, Target, Award } from 'lucide-react';

interface ConversionFunnelProps {
  data: {
    totalViews: number;
    totalContacts: number;
    conversionRate: number;
    uniqueFacilitiesViewed: number;
    uniqueFacilitiesContacted: number;
    topConversionFacilities: Array<{
      id: number;
      nazwa: string;
      miejscowosc: string;
      typ_placowki: string;
      views: number;
      contacts: number;
      conversionRate: number;
    }>;
  };
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const { totalViews, totalContacts, conversionRate, topConversionFacilities } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lejek Konwersji</h2>
          <p className="text-sm text-gray-500">Ścieżka użytkownika od wyświetlenia do kontaktu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Wizualizacja Lejka</h3>
          
          <div className="space-y-4">
            {/* Step 1: Views */}
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-20 rounded-lg flex items-center justify-between px-6 text-white shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <span className="font-semibold text-lg">Wyświetlenia</span>
                </div>
                <span className="text-3xl font-bold">{totalViews}</span>
              </div>
              <div className="absolute -bottom-2 right-6 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow">
                100%
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-blue-400 to-green-400"></div>
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-400"></div>
              </div>
            </div>

            {/* Step 2: Contacts */}
            <div className="relative">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-20 rounded-lg flex items-center justify-between px-6 text-white shadow-md hover:shadow-xl transition-all duration-300"
                style={{ 
                  width: totalViews > 0 ? `${Math.max((totalContacts / totalViews) * 100, 15)}%` : '15%',
                  minWidth: '200px'
                }}
              >
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6" />
                  <span className="font-semibold text-lg">Kontakty</span>
                </div>
                <span className="text-3xl font-bold">{totalContacts}</span>
              </div>
              <div className="absolute -bottom-2 right-6 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded shadow">
                {conversionRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="mt-8 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Wskaźnik Konwersji</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalContacts} z {totalViews} użytkowników podjęło akcję
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-indigo-600">
                  {conversionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Converting Facilities */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Najlepsze Placówki
            <span className="text-sm font-normal text-gray-500">(wg conversion rate)</span>
          </h3>

          {topConversionFacilities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak danych o konwersji</p>
              <p className="text-sm mt-1">Poczekaj na więcej interakcji użytkowników</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topConversionFacilities.map((facility, index) => {
                const isTopThree = index < 3;
                const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];
                
                return (
                  <div 
                    key={facility.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      isTopThree 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isTopThree && (
                            <span className={`text-xl ${medalColors[index]}`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                          {!isTopThree && (
                            <span className="text-sm font-semibold text-gray-400 w-6 text-center">
                              #{index + 1}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900 truncate text-sm">
                            {facility.nazwa}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 ml-8">
                          {facility.miejscowosc} • {facility.typ_placowki}
                        </p>
                        <div className="flex items-center gap-4 mt-2 ml-8 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {facility.views} wyśw.
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {facility.contacts} kont.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`text-2xl font-bold ${
                          facility.conversionRate >= 50 ? 'text-green-600' :
                          facility.conversionRate >= 25 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {facility.conversionRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">konwersja</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}