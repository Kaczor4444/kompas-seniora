'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Show button after scrolling 500px
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
        setIsExpanded(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Handle keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      scrollToTop()
    }
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`
        fixed bottom-24 md:bottom-6 left-0 z-50
        bg-gradient-to-r from-emerald-500 to-emerald-600
        hover:from-emerald-600 hover:to-emerald-700
        text-white
        rounded-r-full
        shadow-lg
        hover:shadow-xl
        transition-all duration-500 ease-out
        focus:outline-none focus:ring-4 focus:ring-emerald-300
        flex items-center gap-2

        ${isExpanded
          ? 'pl-4 pr-4 py-3'
          : 'pl-4 pr-4 py-3 md:pl-4 md:pr-4 -translate-x-[calc(100%-2.5rem)]'
        }

        md:translate-x-0 md:left-6 md:rounded-full
      `}
      aria-label="Przewiń do góry"
      title="Przewiń do góry"
    >
      {/* ArrowUp Icon */}
      <ArrowUp size={20} strokeWidth={2.5} className="flex-shrink-0" />

      {/* Text - smooth fade */}
      <span className={`
        text-sm font-medium whitespace-nowrap
        transition-all duration-500
        ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:opacity-100 md:w-auto'}
      `}>
        Do góry
      </span>
    </button>
  )
}
