import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <>
          {/* Admin Header - tylko dla zalogowanych */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/admin" className="text-xl font-bold text-gray-900">
                    Admin Panel
                  </Link>
                  <nav className="hidden md:flex space-x-4">
                    <Link
                      href="/admin/placowki/dodaj"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dodaj placówkę
                    </Link>
                    <Link
                      href="/admin/placowki"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Lista placówek
                    </Link>
                    <Link
                      href="/admin/security-log"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Security Log
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    ← Wróć do strony głównej
                  </Link>
                  <form action="/api/admin/logout" method="POST">
                    <button
                      type="submit"
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Wyloguj
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </>
      ) : (
        // Strona logowania - bez headera
        children
      )}
    </div>
  );
}