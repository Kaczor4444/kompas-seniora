'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY

      // Calculate percentage
      const totalScroll = documentHeight - windowHeight
      const currentProgress = (scrollTop / totalScroll) * 100

      setProgress(Math.min(currentProgress, 100))
    }

    // Update on scroll
    window.addEventListener('scroll', updateProgress)

    // Initial calculation
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div
      className="fixed top-16 left-0 right-0 h-1 bg-gray-200 z-40 lg:hidden"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Przeczytano ${Math.round(progress)}% artykułu`}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
