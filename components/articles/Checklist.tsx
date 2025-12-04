import React from 'react'
import { Check } from 'lucide-react'

interface ChecklistItem {
  text: string
  checked?: boolean
}

interface ChecklistProps {
  items: ChecklistItem[]
}

export default function Checklist({ items }: ChecklistProps) {
  return (
    <div className="my-8 md:my-12">
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div
              className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                item.checked
                  ? 'bg-emerald-600 border-2 border-emerald-600'
                  : 'border-2 border-gray-300 bg-white'
              }`}
              role="checkbox"
              aria-checked={item.checked || false}
            >
              {item.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </div>
            <span
              className={`text-lg leading-relaxed flex-1 ${
                item.checked ? 'text-gray-900' : 'text-gray-700'
              }`}
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
