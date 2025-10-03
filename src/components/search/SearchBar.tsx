"use client";

import { useState } from 'react';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    console.log('Searching for:', searchQuery);
    // TODO: Implement search logic
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch}>
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 flex items-center overflow-hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Wpisz miejscowość, np. Kamienica, Kraków, Limanowa..."
            className="flex-1 px-6 py-4 text-lg focus:outline-none"
          />
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            className="bg-accent-500 hover:bg-accent-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-8 py-4 font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Szukaj
          </button>
        </div>
        <p className="text-sm text-neutral-500 text-center mt-3">
          💡 Nie musisz znać powiatu - wpisz po prostu nazwę miejscowości
        </p>
      </form>
    </div>
  );
}