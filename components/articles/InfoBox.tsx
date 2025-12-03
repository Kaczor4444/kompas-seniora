import React from 'react'
import { Info } from 'lucide-react'

interface InfoBoxProps {
  children: React.ReactNode
  title?: string
}

export default function InfoBox({ children, title = 'Informacja' }: InfoBoxProps) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-3">
        <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
          <div className="text-lg text-gray-800 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}
