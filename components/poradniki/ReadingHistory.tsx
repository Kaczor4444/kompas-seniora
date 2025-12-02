'use client';

import Link from 'next/link';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { getRelativeTime } from '@/lib/timeUtils';

interface ReadingHistoryProps {
  variant?: 'sidebar' | 'mobile';
}

export default function ReadingHistory({ variant = 'sidebar' }: ReadingHistoryProps) {
  const { history, isClient } = useReadingHistory();

  // Don't render on server (SSR safe)
  if (!isClient) {
    return null;
  }

  // Filter out expired items based on relative time
  const validHistory = history.filter(item => {
    const relativeTime = getRelativeTime(item.timestamp);
    return relativeTime !== null;
  });

  const isEmpty = validHistory.length === 0;

  if (variant === 'sidebar') {
    return (
      <div className="sticky top-60 mt-6">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2 text-xl">📚</span>
            Ostatnio czytane
          </h3>

          {isEmpty ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Brak ostatnio czytanych artykułów
            </p>
          ) : (
            <div className="space-y-3">
              {validHistory.map((article) => {
                const relativeTime = getRelativeTime(article.timestamp);
                return (
                  <Link
                    key={`${article.sectionId}-${article.slug}`}
                    href={`/poradniki/${article.sectionId}/${article.slug}`}
                    className="group flex gap-2.5 p-2.5 rounded-lg hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-1" title={article.title}>
                        {article.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {relativeTime}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile variant
  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
        <span className="mr-2 text-xl">📚</span>
        Ostatnio czytane
      </h2>

      {isEmpty ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">
            Brak ostatnio czytanych artykułów
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {validHistory.map((article) => {
            const relativeTime = getRelativeTime(article.timestamp);
            return (
              <Link
                key={`mobile-${article.sectionId}-${article.slug}`}
                href={`/poradniki/${article.sectionId}/${article.slug}`}
                className="group flex flex-col p-3 rounded-lg hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
              >
                <h3 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
                  {article.title}
                </h3>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {relativeTime}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
