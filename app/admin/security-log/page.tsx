import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function SecurityLogPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  // Pobierz wszystkie logi (ostatnie 100)
  const logs = await prisma.adminSecurityLog.findMany({
    take: 100,
    orderBy: { timestamp: 'desc' },
  });

  const EVENT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    login_success: { label: 'Zalogowano pomyślnie', emoji: '✅', color: 'text-green-600' },
    login_failed: { label: 'Nieudane logowanie', emoji: '❌', color: 'text-red-600' },
    logout: { label: 'Wylogowano', emoji: '🔒', color: 'text-gray-600' },
    rate_limit: { label: 'Zablokowano (rate limit)', emoji: '🚫', color: 'text-orange-600' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Log</h1>
        <p className="mt-2 text-gray-600">
          Historia logowań i zdarzeń bezpieczeństwa (ostatnie 100)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(EVENT_LABELS).map(([type, info]) => {
          const count = logs.filter(log => log.eventType === type).length;
          return (
            <div key={type} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{info.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
                <span className="text-3xl">{info.emoji}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Typ zdarzenia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adres IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data i czas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Szczegóły
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const info = EVENT_LABELS[log.eventType] || { 
                label: log.eventType, 
                emoji: '📝', 
                color: 'text-gray-600' 
              };
              
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.emoji}</span>
                      <span className={`text-sm font-medium ${info.color}`}>
                        {info.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString('pl-PL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.userAgent ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          Zobacz User Agent
                        </summary>
                        <p className="mt-2 text-xs break-all">{log.userAgent}</p>
                      </details>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Brak logów bezpieczeństwa</p>
          </div>
        )}
      </div>
    </div>
  );
}
