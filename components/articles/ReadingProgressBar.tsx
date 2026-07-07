'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(false)

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const totalScroll = documentHeight - windowHeight
      const currentProgress = (scrollTop / totalScroll) * 100
      setProgress(Math.min(currentProgress, 100))
    }

    const checkBodyClasses = () => {
      setIsHighContrast(document.body.classList.contains('accessibility-high-contrast'))
      setToolbarVisible(document.body.classList.contains('accessibility-toolbar-visible'))
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress()
    checkBodyClasses()

    const observer = new MutationObserver(checkBodyClasses)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('scroll', updateProgress)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      className={`fixed left-0 right-0 h-1.5 z-[51] pointer-events-none shadow-sm hidden md:block transition-[top] duration-300 ${
        isHighContrast ? 'bg-slate-800' : 'bg-stone-100'
      }`}
      style={{ top: toolbarVisible ? '128px' : '80px' }}
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
