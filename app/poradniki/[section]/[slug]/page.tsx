'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { sections } from '@/data/articles';
import { useReadingHistory } from '@/hooks/useReadingHistory';

interface ArticlePageProps {
  params: {
    section: string;
    slug: string;
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { addToHistory } = useReadingHistory();

  // Find the section and article
  const section = sections.find(s => s.id === params.section);
  const article = section?.articles.find(a => a.slug === params.slug);

  // Track reading history on mount
  useEffect(() => {
    if (article && section) {
      addToHistory({
        slug: article.slug,
        sectionId: section.id,
        title: article.title,
        category: article.category,
      });
    }
  }, [article, section, addToHistory]);

  // 404 if article not found
  if (!section || !article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              Strona główna
            </Link>
            <span className="mx-2">/</span>
            <Link href="/poradniki" className="hover:text-emerald-600 transition-colors">
              Poradniki
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Category Badge */}
        <div className="mb-4">
          <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${article.categoryColor}`}>
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-gray-600 mb-8">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{article.readTime} min czytania</span>
          </div>
          {article.isPopular && (
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              Popularny
            </span>
          )}
          {article.isNew && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
              Nowy
            </span>
          )}
        </div>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
          <Image
            src={article.thumbnail}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            {article.excerpt}
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
            <p className="text-gray-800 italic">
              Szczegółowa treść artykułu będzie dostępna wkrótce. Obecnie wyświetlany jest podgląd artykułu.
            </p>
          </div>

          {/* Placeholder content */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Wprowadzenie</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Ten artykuł pomoże Ci lepiej zrozumieć temat i podjąć świadome decyzje dotyczące opieki nad seniorami.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Kluczowe informacje</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Znajdziesz tutaj praktyczne wskazówki i sprawdzone rozwiązania, które pomogą w codziennym życiu.
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/poradniki"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Powrót do poradników
          </Link>
        </div>
      </article>
    </div>
  );
}
