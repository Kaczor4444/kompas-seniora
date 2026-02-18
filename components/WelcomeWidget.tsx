'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ChevronRight, Sparkles } from 'lucide-react'

export default function WelcomeWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end">

      {/* Modal */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex items-start justify-between">
            <div>
              <p className="text-white font-black text-base">Hej, pomożemy Ci! 👋</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Czego szukasz dla swojego bliskiego?</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors ml-3 mt-0.5 flex-shrink-0"
              aria-label="Zamknij"
            >
              <X size={16} />
            </button>
          </div>

          {/* Options */}
          <div className="p-3 space-y-2">

            <Link
              href="/search?type=dps"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
            >
              <div className="min-w-0 mr-2">
                <p className="text-sm font-black text-slate-900">Dom Pomocy Społecznej</p>
                <p className="text-xs text-slate-500 font-medium">DPS — całodobowa opieka</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>

            <Link
              href="/search?type=śds"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-4 py-3.5 transition-all group"
            >
              <div className="min-w-0 mr-2">
                <p className="text-sm font-black text-slate-900">Środowiskowy Dom Samopomocy</p>
                <p className="text-xs text-slate-500 font-medium">ŚDS — opieka dzienna</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>

            <Link
              href="/nie-wiem"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl px-4 py-3.5 transition-all group"
            >
              <div className="min-w-0 mr-2">
                <p className="text-sm font-black text-white">Nie wiem, potrzebuję pomocy</p>
                <p className="text-xs text-emerald-100 font-medium">Wyjaśniamy różnice i doradzamy</p>
              </div>
              <Sparkles size={16} className="text-white flex-shrink-0" />
            </Link>

          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-400 pb-3 px-4">
            Małopolska · Dane z BIP · Bezpłatnie
          </p>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-xl overflow-hidden hover:scale-105 transition-all active:scale-95"
        aria-label="Pomoc w wyborze placówki"
      >
        {isOpen ? (
          <X size={20} className="text-slate-700" />
        ) : (
          <img
            src="/advisor.png"
            alt="Doradca"
            className="w-full h-full object-cover rounded-full"
          />
        )}
      </button>
    </div>
  )
}
