'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  article: {
    title: string;
    slug: string;
    thumbnail: string;
    category: string;
    categoryColor: string;
    excerpt: string;
    readTime: number;
    isNew?: boolean;
    isPopular?: boolean;
    sectionId: string;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/poradniki/${article.sectionId}/${article.slug}`}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col"
    >
      {/* Image 16:9 */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <Image
          src={article.thumbnail}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {article.isNew && (
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              NOWY
            </span>
          )}
          {article.isPopular && (
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-md">
              Popularny
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category Tag */}
        <div className="mb-3">
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${article.categoryColor}`}>
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h3 
          className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-3 line-clamp-2"
          title={article.title}
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1">
          {article.excerpt}
        </p>

        {/* Read Time */}
        <div className="flex items-center text-sm text-gray-500 pt-3 border-t border-gray-100">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{article.readTime} min czytania</span>
        </div>
      </div>
    </Link>
  );
}
