import React from 'react'

interface ProcessStep {
  title: string
  description?: string
}

interface ProcessTimelineProps {
  steps: ProcessStep[]
  title?: string
}

export default function ProcessTimeline({ steps, title = 'Proces krok po kroku' }: ProcessTimelineProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-7 md:p-8 my-8 md:my-12">
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
        {title}
      </h3>

      <div className="relative">
        {steps.map((step, index) => (
          <div key={index} className="relative flex gap-4 md:gap-6 pb-8 last:pb-0">
            {/* Vertical line connecting steps (except for last step) */}
            {index < steps.length - 1 && (
              <div className="absolute left-[18px] md:left-[22px] top-[44px] bottom-0 w-0.5 bg-emerald-300" />
            )}

            {/* Numbered circle */}
            <div className="relative flex-shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg z-10">
              <span className="text-white font-bold text-lg md:text-xl">
                {index + 1}
              </span>
            </div>

            {/* Step content */}
            <div className="flex-1 pt-0.5">
              <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h4>
              {step.description && (
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
