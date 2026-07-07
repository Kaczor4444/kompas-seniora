'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const updateProgress = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      setProgress(Math.min((window.scrollY / totalScroll) * 100, 100))
    }

    const checkHighContrast = () => {
      setIsHighContrast(document.body.classList.contains('accessibility-high-contrast'))
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress()
    checkHighContrast()

    const observer = new MutationObserver(checkHighContrast)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('scroll', updateProgress)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      className={`fixed top-20 left-0 right-0 h-1.5 z-[51] pointer-events-none shadow-sm md:hidden ${
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
