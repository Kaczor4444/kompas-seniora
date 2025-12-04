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
    <ul className="space-y-4 my-8 md:my-12">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-4 rounded-lg border border-gray-200 p-5 md:p-6 min-h-[60px] hover:bg-emerald-50/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          role="checkbox"
          aria-checked={item.checked || false}
          tabIndex={0}
        >
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-colors ${
              item.checked
                ? 'bg-emerald-600 border-emerald-600'
                : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            {item.checked && (
              <Check className="w-5 h-5 text-white" />
            )}
          </div>
          <span
            className={`text-lg md:text-xl leading-loose ${
              item.checked ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}
