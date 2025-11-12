import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  // Auth check
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  // Pobierz podstawowe statystyki
  const totalPlacowki = await prisma.placowka.count();
  const totalDPS = await prisma.placowka.count({
    where: { typ_placowki: 'DPS' },
  });
  const totalSDS = await prisma.placowka.count({
    where: { typ_placowki: 'ŚDS' },
  });

  // Ostatnie logi security (10 najnowszych)
  const recentLogs = await prisma.adminSecurityLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Witaj w panelu administracyjnym Kompas Seniora
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Wszystkie placówki
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalPlacowki}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            DPS
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {totalDPS}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            ŚDS
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {totalSDS}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Szybkie akcje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/placowki/dodaj"
            className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-lg font-medium text-gray-900">
              ➕ Dodaj nową placówkę
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Formularz dodawania zweryfikowanych placówek DPS/ŚDS
            </p>
          </Link>

          <Link
            href="/admin/placowki"
            className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-lg font-medium text-gray-900">
              📋 Lista placówek
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Przeglądaj i edytuj istniejące placówki
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Security Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Ostatnia aktywność
          </h2>
          <Link
            href="/admin/security-log"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Zobacz wszystkie →
          </Link>
        </div>
        
        {recentLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">Brak aktywności</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {log.eventType === 'login_success' && '✅'}
                    {log.eventType === 'login_failed' && '❌'}
                    {log.eventType === 'logout' && '🔒'}
                    {log.eventType === 'rate_limit' && '🚫'}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.eventType === 'login_success' && 'Zalogowano pomyślnie'}
                      {log.eventType === 'login_failed' && 'Nieudane logowanie'}
                      {log.eventType === 'logout' && 'Wylogowano'}
                      {log.eventType === 'rate_limit' && 'Zablokowano (rate limit)'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.ipAddress} • {new Date(log.timestamp).toLocaleString('pl-PL')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}