import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          {/* 404 Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-accent-50 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-accent-600">404</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Nie znaleziono strony
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ups! Strona, której szukasz nie istnieje lub została przeniesiona.
          </p>

          {/* Action Button */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
