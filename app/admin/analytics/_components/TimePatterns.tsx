'use client';

import { Clock, Calendar, Zap, TrendingUp } from 'lucide-react';

interface TimePatternsProps {
  data: {
    hourly: Array<{
      hour: number;
      totalEvents: number;
      views: number;
      contacts: number;
    }>;
    daily: Array<{
      dayOfWeek: number;
      dayName: string;
      totalEvents: number;
      views: number;
      contacts: number;
    }>;
    peakHours: Array<{
      hour: number;
      totalEvents: number;
      label: string;
    }>;
  };
}

export default function TimePatterns({ data }: TimePatternsProps) {
  const { hourly, daily, peakHours } = data;

  const maxHourlyEvents = Math.max(...hourly.map(h => h.totalEvents), 1);
  const maxDailyEvents = Math.max(...daily.map(d => d.totalEvents), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl border border-orange-200">
          <Clock className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wzorce Czasowe</h2>
          <p className="text-sm text-gray-500">Kiedy użytkownicy są najbardziej aktywni</p>
        </div>
      </div>

      {/* Peak Hours Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {peakHours.map((peak, index) => (
          <div 
            key={peak.hour}
            className="bg-white rounded-xl shadow-lg p-4 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${
                index === 0 ? 'text-orange-500' : 
                index === 1 ? 'text-yellow-500' : 
                'text-gray-500'
              }`} />
              <h3 className="font-semibold text-gray-700">
                {index === 0 ? 'Szczyt #1' : index === 1 ? 'Szczyt #2' : 'Szczyt #3'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{peak.label}</p>
            <p className="text-sm text-gray-500 mt-1">{peak.totalEvents} wydarzeń</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Pattern */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Aktywność według godzin
          </h3>

          {hourly.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak danych o godzinach</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hourly.map((hour) => (
                <div key={hour.hour} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 w-16">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {hour.views}v
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {hour.contacts}c
                      </span>
                      <span className="font-bold text-gray-900 ml-2">
                        {hour.totalEvents}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      {/* Views bar (blue) */}
                      <div
                        className="absolute top-0 left-0 bg-blue-400 h-6 rounded-full transition-all duration-500"
                        style={{
                          width: `${(hour.views / maxHourlyEvents) * 100}%`,
                          minWidth: hour.views > 0 ? '4px' : '0'
                        }}
                      />
                      {/* Contacts bar (green, overlaid) */}
                      <div
                        className="absolute top-0 left-0 bg-green-500 h-6 rounded-full transition-all duration-500"
                        style={{
                          width: `${(hour.contacts / maxHourlyEvents) * 100}%`,
                          minWidth: hour.contacts > 0 ? '4px' : '0'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>Wyświetlenia</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Kontakty</span>
            </div>
          </div>
        </div>

        {/* Daily Pattern */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Aktywność według dni tygodnia
          </h3>

          {daily.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak danych o dniach tygodnia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daily.map((day) => {
                const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
                
                return (
                  <div 
                    key={day.dayOfWeek}
                    className={`p-4 rounded-lg border transition-all ${
                      isWeekend 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          isWeekend ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {day.dayName}
                        </span>
                        {isWeekend && (
                          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            Weekend
                          </span>
                        )}
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {day.totalEvents}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* Views bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20">Wyświetlenia</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                            style={{
                              width: `${(day.views / maxDailyEvents) * 100}%`,
                              minWidth: day.views > 0 ? '8px' : '0'
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-10 text-right">
                          {day.views}
                        </span>
                      </div>

                      {/* Contacts bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20">Kontakty</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-500"
                            style={{
                              width: `${(day.contacts / maxDailyEvents) * 100}%`,
                              minWidth: day.contacts > 0 ? '8px' : '0'
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-10 text-right">
                          {day.contacts}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Insights */}
          {daily.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Insights:</p>
                  <p>
                    {daily.reduce((max, day) => day.totalEvents > max.totalEvents ? day : max).dayName} 
                    {' '}jest najbardziej aktywnym dniem ({daily.reduce((max, day) => day.totalEvents > max.totalEvents ? day : max).totalEvents} wydarzeń).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
