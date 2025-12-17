import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface WarningBoxProps {
  children: React.ReactNode
  title?: string
}

export default function WarningBox({ children, title = 'Ważne!' }: WarningBoxProps) {
  return (
    <div className="bg-warning-50 border-2 border-warning-300 rounded-xl p-7 md:p-8 my-8 md:my-12">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
          <div className="text-lg text-gray-800 leading-relaxed font-medium">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
