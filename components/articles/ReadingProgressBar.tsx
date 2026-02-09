'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const [isHighContrast, setIsHighContrast] = useState(false)

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

    // Check high contrast mode
    const checkHighContrast = () => {
      setIsHighContrast(document.body.classList.contains('accessibility-high-contrast'))
    }

    // Update on scroll
    window.addEventListener('scroll', updateProgress)

    // Initial calculations
    updateProgress()
    checkHighContrast()

    // Observer for body class changes
    const observer = new MutationObserver(checkHighContrast)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('scroll', updateProgress)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      className={`fixed top-20 left-0 right-0 h-1 z-[51] pointer-events-none shadow-sm hidden md:block ${
        isHighContrast ? 'bg-slate-800' : 'bg-stone-100'
      }`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Przeczytano ${Math.round(progress)}% artykułu`}
    >
      <div
        className={`h-full transition-all duration-150 ease-linear shadow-[0_0_12px_rgba(5,150,105,0.4)] ${
          isHighContrast ? 'bg-yellow-400' : 'bg-primary-600'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
