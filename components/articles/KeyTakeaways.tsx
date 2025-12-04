import React from 'react'
import { CheckCircle } from 'lucide-react'

interface KeyTakeawaysProps {
  items: string[]
}

export default function KeyTakeaways({ items }: KeyTakeawaysProps) {
  return (
    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-7 md:p-8 my-8 md:my-12">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CheckCircle className="w-6 h-6 text-emerald-600" />
        Najważniejsze wnioski
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-lg text-gray-800">
            <span className="text-emerald-600 font-bold mt-1 text-xl" aria-hidden="true">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
