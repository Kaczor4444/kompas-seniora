'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, 
  Phone, 
  Mail, 
  Globe, 
  Heart,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalEvents: number;
    recentEventsCount: number;
    eventsByType: Array<{ type: string; count: number }>;
  };
  topViewed: Array<{
    id: number;
    nazwa: string;
    miejscowosc: string;
    wojewodztwo: string;
    typ_placowki: string;
    views: number;
  }>;
  topContacted: Array<{
    id: number;
    nazwa: string;
    miejscowosc: string;
    wojewodztwo: string;
    typ_placowki: string;
    contacts: number;
  }>;
  recentActivity: Array<{
    id: number;
    eventType: string;
    timestamp: string;
    placowka: {
      id: number;
      nazwa: string;
      miejscowosc: string;
    };
  }>;
  dailyActivity: Array<{ date: string; count: number }>;
  statsByWojewodztwo: Array<{
    wojewodztwo: string;
    views: number;
    contacts: number;
  }>;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
}

const EVENT_LABELS: Record<string, string> = {
  view: 'Wyświetlenia',
  phone_click: 'Kliknięcia telefon',
  email_click: 'Kliknięcia email',
  website_click: 'Kliknięcia WWW',
  favorite_add: 'Dodano do ulubionych',
  favorite_remove: 'Usunięto z ulubionych',
  compare_add: 'Dodano do porównania',
  share: 'Udostępnienia',
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  phone_click: <Phone className="h-4 w-4" />,
  email_click: <Mail className="h-4 w-4" />,
  website_click: <Globe className="h-4 w-4" />,
  favorite_add: <Heart className="h-4 w-4" />,
  favorite_remove: <Heart className="h-4 w-4" />,
  compare_add: <BarChart3 className="h-4 w-4" />,
  share: <TrendingUp className="h-4 w-4" />,
};

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Brak danych analitycznych</p>
      </div>
    );
  }

  const totalViews = data.overview.eventsByType.find(e => e.type === 'view')?.count || 0;
  const totalPhoneClicks = data.overview.eventsByType.find(e => e.type === 'phone_click')?.count || 0;
  const totalEmailClicks = data.overview.eventsByType.find(e => e.type === 'email_click')?.count || 0;
  const totalWebsiteClicks = data.overview.eventsByType.find(e => e.type === 'website_click')?.count || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitorowanie aktywności użytkowników
          </p>
        </div>
        
        {/* Time Range Selector */}
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value={7}>Ostatnie 7 dni</option>
          <option value={30}>Ostatnie 30 dni</option>
          <option value={90}>Ostatnie 90 dni</option>
        </select>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Wyświetlenia</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalViews}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Kliknięcia telefon</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPhoneClicks}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Kliknięcia email</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalEmailClicks}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Kliknięcia WWW</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalWebsiteClicks}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          Aktywność dzienna
        </h2>
        <div className="space-y-2">
          {data.dailyActivity.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-24">
                {new Date(day.date).toLocaleDateString('pl-PL', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                <div
                  className="bg-emerald-600 h-8 rounded-full flex items-center justify-end pr-3"
                  style={{
                    width: `${Math.min((day.count / Math.max(...data.dailyActivity.map(d => d.count))) * 100, 100)}%`,
                    minWidth: day.count > 0 ? '40px' : '0'
                  }}
                >
                  <span className="text-sm font-medium text-white">{day.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Najpopularniejsze placówki
          </h2>
          <div className="space-y-3">
            {data.topViewed.length === 0 ? (
              <p className="text-gray-500 text-sm">Brak danych</p>
            ) : (
              data.topViewed.map((placowka, index) => (
                <div key={placowka.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {placowka.nazwa}
                    </p>
                    <p className="text-xs text-gray-500">
                      {placowka.miejscowosc} • {placowka.typ_placowki}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">{placowka.views}</p>
                    <p className="text-xs text-gray-500">wyświetleń</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Contacted */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📞 Najczęściej kontaktowane
          </h2>
          <div className="space-y-3">
            {data.topContacted.length === 0 ? (
              <p className="text-gray-500 text-sm">Brak danych</p>
            ) : (
              data.topContacted.map((placowka, index) => (
                <div key={placowka.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {placowka.nazwa}
                    </p>
                    <p className="text-xs text-gray-500">
                      {placowka.miejscowosc} • {placowka.typ_placowki}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">{placowka.contacts}</p>
                    <p className="text-xs text-gray-500">kontaktów</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stats by Wojewodztwo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📍 Statystyki według województw
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Województwo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wyświetlenia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakty
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.statsByWojewodztwo.map((stat) => (
                <tr key={stat.wojewodztwo} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stat.wojewodztwo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {stat.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {stat.contacts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          Ostatnia aktywność
        </h2>
        <div className="space-y-2">
          {data.recentActivity.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 text-gray-600">
                {EVENT_ICONS[event.eventType] || <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{EVENT_LABELS[event.eventType] || event.eventType}</span>
                  {' • '}
                  <span className="text-gray-600">{event.placowka.nazwa}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {event.placowka.miejscowosc} • {new Date(event.timestamp).toLocaleString('pl-PL')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
