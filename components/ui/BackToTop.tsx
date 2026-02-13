'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const scrollTargetRef = useRef<Element | null>(null)

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as Element | Document

      // Inner scrollable div (e.g. search results list)
      if (
        target instanceof Element &&
        target !== document.documentElement &&
        target !== document.body
      ) {
        scrollTargetRef.current = target
        setIsVisible(target.scrollTop > 300)
      } else {
        // Regular window scroll
        scrollTargetRef.current = null
        setIsVisible(window.scrollY > 300)
      }
    }

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', handleScroll, { capture: true })
  }, [])

  const scrollToTop = () => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] md:bottom-8 left-0 z-50
        bg-gradient-to-r from-emerald-500 to-emerald-600
        hover:from-emerald-600 hover:to-emerald-700
        text-white
        rounded-r-full
        shadow-lg hover:shadow-xl
        transition-all duration-300
        focus:outline-none focus:ring-4 focus:ring-emerald-300
        flex items-center gap-2
        pl-4 pr-5 py-3.5
        md:pl-5 md:pr-5 md:py-3.5
      `}
      aria-label="Przewiń do góry"
      title="Przewiń do góry"
    >
      <ArrowUp size={22} strokeWidth={2.5} className="flex-shrink-0" />
      <span className="text-sm font-semibold whitespace-nowrap hidden sm:inline">
        Do góry
      </span>
    </button>
  )
}
