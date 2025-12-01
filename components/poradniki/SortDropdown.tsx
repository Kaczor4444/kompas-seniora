'use client';

import { BarsArrowDownIcon } from '@heroicons/react/24/outline';

interface SortDropdownProps {
  onSortChange: (sortBy: string) => void;
}

export default function SortDropdown({ onSortChange }: SortDropdownProps) {
  const options = [
    { value: 'recommended', label: 'Polecane' },
    { value: 'newest', label: 'Najnowsze' }
  ];

  return (
    <div className="relative flex items-center gap-2">
      <BarsArrowDownIcon className="w-5 h-5 text-gray-500" />
      <select
        onChange={(e) => onSortChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 font-medium text-sm text-gray-700 hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer min-h-[44px]"
        defaultValue="recommended"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
