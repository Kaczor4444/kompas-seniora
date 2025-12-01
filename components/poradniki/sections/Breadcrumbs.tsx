import Link from 'next/link';

interface BreadcrumbsProps {
  activeCategory: string;
}

export default function Breadcrumbs({ activeCategory }: BreadcrumbsProps) {
  return (
    <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <ol className="flex items-center space-x-2 text-base">
          <li>
            <Link href="/" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Strona główna
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link
              href="/poradniki" 
              className={activeCategory !== 'Wszystkie' ? 'text-gray-600 hover:text-emerald-600 transition-colors' : 'text-gray-900 font-medium'}
            >
              Poradniki
            </Link>
          </li>
          {activeCategory !== 'Wszystkie' && (
            <>
              <li className="text-gray-500">/</li>
              <li className="text-gray-900 font-medium" aria-current="page">
                {activeCategory}
              </li>
            </>
          )}
        </ol>
      </div>
    </nav>
  );
}
